/**
 * One-off: create or reset staging admin password.
 * Usage: DATABASE_URI=... PAYLOAD_SECRET=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node ...
 */
import { getPayload } from "payload";
import config from "../../payload.config.ts";

const email = process.env.ADMIN_EMAIL || "mrdudekowski@yandex.ru";
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Admin";

if (!password || password.length < 8) {
  console.error("ADMIN_PASSWORD required (min 8 chars)");
  process.exit(1);
}

const payload = await getPayload({ config });
const existing = await payload.find({
  collection: "users",
  where: { email: { equals: email } },
  limit: 1,
  overrideAccess: true,
});

if (existing.docs[0]) {
  await payload.update({
    collection: "users",
    id: existing.docs[0].id,
    data: { password, role: "admin", status: "active", name },
    overrideAccess: true,
  });
  console.log(`Updated admin password for ${email}`);
} else {
  await payload.create({
    collection: "users",
    data: { email, password, role: "admin", status: "active", name },
    overrideAccess: true,
  });
  console.log(`Created admin ${email}`);
}

process.exit(0);
