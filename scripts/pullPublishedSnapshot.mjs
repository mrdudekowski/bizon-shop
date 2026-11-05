import { writeFile } from "node:fs/promises";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const source = process.env.CONTENT_SNAPSHOT_SOURCE?.trim();
if (!source) {
  console.log("CONTENT_SNAPSHOT_SOURCE is unset; local CMS will use only the admin API.");
  process.exit(0);
}

const response = await fetch(source, { cache: "no-store" });
if (!response.ok) {
  throw new Error(`Published content snapshot returned HTTP ${response.status}`);
}
const payload = await response.json();
const revision = payload?.revision;
if (payload?.schema !== 1 || typeof revision !== "string" || !/^sha256:[a-f0-9]{64}$/.test(revision)) {
  throw new Error("Published content snapshot is not a schema 1 revision");
}

await writeFile(new URL("../public/content-snapshot.json", import.meta.url), `${JSON.stringify(payload)}\n`);
console.log(`Pulled published content snapshot ${revision}`);
