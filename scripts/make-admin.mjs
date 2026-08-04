// Promote a user to a staff role. Run with:
//   npm run make-admin -- you@example.com            (defaults to super_admin)
//   npm run make-admin -- you@example.com inventory_manager
// Loads env from .env.local via node --env-file (see package.json script).
import mongoose from "mongoose";

const { Schema } = mongoose;
const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI missing. Run via `npm run make-admin` (loads .env.local).");
  process.exit(1);
}

const ROLES = [
  "customer",
  "support_executive",
  "inventory_manager",
  "marketing_manager",
  "super_admin",
];

const email = process.argv[2]?.toLowerCase();
const role = process.argv[3] ?? "super_admin";

if (!email) {
  console.error("Usage: npm run make-admin -- <email> [role]");
  console.error("Roles:", ROLES.join(", "));
  process.exit(1);
}
if (!ROLES.includes(role)) {
  console.error(`Invalid role "${role}". Valid roles:`, ROLES.join(", "));
  process.exit(1);
}

const User = mongoose.model("User", new Schema({}, { strict: false, timestamps: true }));

await mongoose.connect(URI, { dbName: "fivexl" });
const res = await User.updateOne({ email }, { $set: { role } });

if (res.matchedCount === 0) {
  console.error(`No user found with email "${email}". Register first, then re-run.`);
} else {
  console.log(`✅ ${email} is now "${role}".`);
}

await mongoose.disconnect();
process.exit(res.matchedCount === 0 ? 1 : 0);
