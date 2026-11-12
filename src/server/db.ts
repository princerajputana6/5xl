import mongoose, { type Connection, type Model, type Schema } from "mongoose";
import { after } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { env } from "@/env";

/**
 * MongoDB connections for Cloudflare Workers.
 *
 * Mongoose is built for a long-lived Node server where a single connection is
 * cached and reused across invocations. Cloudflare Workers break that model in
 * two ways:
 *  1. The runtime forbids reusing an I/O object (socket) created while handling
 *     a *different* request — so a process-wide shared connection hangs the next
 *     request that touches it.
 *  2. A Worker isolate serves many requests concurrently, so a shared mutable
 *     connection would be torn down by one request while another is mid-query.
 *
 * The robust answer is a connection *per request*:
 *  - The connection holder is stored in a `WeakMap` keyed by the request's
 *    Cloudflare execution context (`getCloudflareContext().ctx`), which OpenNext
 *    resolves consistently across Server Components, Route Handlers and Server
 *    Actions. (React's `cache()` only memoises inside an RSC render, so it
 *    silently fails in Route Handlers.) Concurrent callers in one request share
 *    one connection; separate requests get separate, isolated sockets.
 *  - Every model is reached through a proxy (`defineModel`) that resolves the
 *    real model on the *current request's* connection, so no `import { User }`
 *    call site has to change.
 *  - `after()` closes the request's connection once the response is sent.
 *
 * On a traditional Node host (`next start`) this still works — it just opens and
 * closes a connection per request, a minor cost for a single code path.
 */
const CONNECT_OPTS: mongoose.ConnectOptions = {
  bufferCommands: false,
  dbName: "fivexl",
  // Fail fast rather than hang; a single socket per request can't be pooled
  // across requests anyway.
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 1,
  minPoolSize: 0,
};

/** Every model's schema, filled as model modules load (see `defineModel`). */
const schemaRegistry = new Map<string, Schema>();

type ConnHolder = { promise: Promise<Connection> | null; conn: Connection | null };

/** Holders keyed by the per-request execution context; GC'd with the request. */
const holdersByRequest = new WeakMap<object, ConnHolder>();
/** Fallback holder for the rare non-request context (DB shouldn't be hit there). */
const fallbackHolder: ConnHolder = { promise: null, conn: null };

function requestConn(): ConnHolder {
  let key: object;
  try {
    key = getCloudflareContext().ctx as unknown as object;
  } catch {
    return fallbackHolder;
  }
  let holder = holdersByRequest.get(key);
  if (!holder) {
    holder = { promise: null, conn: null };
    holdersByRequest.set(key, holder);
  }
  return holder;
}

async function openConnection(holder: ConnHolder): Promise<Connection> {
  mongoose.set("strictQuery", true);

  // Ensure every model module has loaded so ref population can resolve sibling
  // models on this connection. Dynamic import avoids a static import cycle
  // (model modules import this file) and is cached after the first request.
  await import("@/server/models");

  const conn = mongoose.createConnection(env.MONGODB_URI, CONNECT_OPTS);
  await conn.asPromise();

  // Register every schema on this connection so queries and `populate()` work.
  for (const [name, schema] of schemaRegistry) {
    if (!conn.models[name]) conn.model(name, schema);
  }

  holder.conn = conn;

  // Close this request's socket once the response is sent, so nothing leaks
  // into the next request and no dead socket is ever reused.
  after(async () => {
    try {
      await conn.close();
    } catch {
      /* best-effort teardown */
    }
  });

  return conn;
}

/** The MongoDB connection dedicated to the current request. */
export function connectDB(): Promise<Connection> {
  const holder = requestConn();
  if (!holder.promise) holder.promise = openConnection(holder);
  return holder.promise;
}

function currentConnection(): Connection {
  const holder = requestConn();
  if (!holder.conn) {
    throw new Error(
      "No MongoDB connection for this request — `await connectDB()` before using a model."
    );
  }
  return holder.conn;
}

/**
 * Register a model schema and return a request-scoped proxy for it. Each use
 * resolves the real model on the current request's connection, so concurrent
 * requests never share a socket and no call site has to change.
 */
export function defineModel<TDoc>(name: string, schema: Schema): Model<TDoc> {
  schemaRegistry.set(name, schema);

  // Note: the handler and target are typed loosely (`object`) on purpose.
  // Typing the Proxy over mongoose's `Model<TDoc>` makes TypeScript instantiate
  // `ProxyHandler<Model<TDoc>>`, whose trap signatures expand the (huge) Model
  // type and exhaust the type checker's heap. We cast the finished proxy once.
  const resolve = (): Record<PropertyKey, unknown> => {
    const conn = currentConnection();
    const model = conn.models[name] ?? conn.model(name, schema);
    return model as unknown as Record<PropertyKey, unknown>;
  };

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      const model = resolve();
      if (prop === Symbol.hasInstance) {
        return (instance: unknown) => instance instanceof (model as unknown as Function);
      }
      const value = model[prop];
      return typeof value === "function"
        ? (value as (...a: unknown[]) => unknown).bind(model)
        : value;
    },
    construct(_target, args) {
      const Ctor = resolve() as unknown as new (...a: unknown[]) => object;
      return new Ctor(...args);
    },
    apply() {
      throw new Error(`Model "${name}" is not callable.`);
    },
  };

  return new Proxy(function () {}, handler) as unknown as Model<TDoc>;
}
