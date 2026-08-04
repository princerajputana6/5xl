// Seed (or reset) the default super-admin account. Idempotent.
//   npm run seed:admin
// Optionally override: npm run seed:admin -- admin@5xl.com "5xl@123"
// Loads env from .env.local via node --env-file (see package.json script).
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;
const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI missing. Run via `npm run seed:admin` (loads .env.local).");
  process.exit(1);
}

const email = (process.argv[2] ?? "admin@5xl.com").toLowerCase();
const password = process.argv[3] ?? "5xl@123";

const User = mongoose.model("User", new Schema({}, { strict: false, timestamps: true }));

await mongoose.connect(URI, { dbName: "fivexl" });

const passwordHash = await bcrypt.hash(password, 10);

// Upsert: always ensure the role + known password work; only set name on create.
await User.updateOne(
  { email },
  {
    $set: {
      email,
      passwordHash,
      role: "super_admin",
      status: "active",
      emailVerified: true,
    },
    $setOnInsert: { name: "5XL Admin" },
  },
  { upsert: true }
);

console.log(`✅ Admin ready — email: ${email}  password: ${password}  (role: super_admin)`);

await mongoose.disconnect();
process.exit(0);
