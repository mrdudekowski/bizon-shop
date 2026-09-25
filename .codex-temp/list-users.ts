import { getPayload } from "../src/lib/payload/getPayload";
const payload = await getPayload();
const users = await payload.find({ collection: "users", limit: 50, overrideAccess: true, depth: 0 });
console.log("DB=", process.env.DATABASE_URI);
console.log("count=", users.totalDocs);
for (const u of users.docs) {
  console.log(JSON.stringify({ id: u.id, email: u.email, role: u.role, status: u.status, name: u.name }));
}
process.exit(0);
