import { getPayload } from "../src/lib/payload/getPayload";

const email = process.env.ADMIN_EMAIL || "mrdudekowski@yandex.ru";
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Admin";

if (!password || password.length < 8) {
  throw new Error("ADMIN_PASSWORD required (min 8 chars)");
}

const payload = await getPayload();
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
    overrideLock: true,
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
