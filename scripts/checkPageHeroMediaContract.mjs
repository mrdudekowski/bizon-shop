import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cmsPath = "src/admin/pages/pageHeroMediaContract.json";
const publicRef = "origin/main-app:src/lib/content/pageHeroMediaContract.json";
const cmsRoot = new URL("../", import.meta.url);

function publicContractPath(args) {
  if (args.length === 0) return undefined;
  if (args.length !== 2 || args[0] !== "--public-contract" || !args[1] || args[1].startsWith("--")) {
    throw new Error("Usage: node scripts/checkPageHeroMediaContract.mjs [--public-contract <path>]");
  }
  return resolve(args[1]);
}

function readPublicContract(path) {
  try {
    if (path) return readFileSync(path);
    return execFileSync("git", ["show", publicRef], { cwd: cmsRoot, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const reason = error.stderr?.toString("utf8").trim() || error.message;
    throw new Error(`Cannot read ${path ?? publicRef}. ${reason}`);
  }
}

function readVersion(bytes, path) {
  let contract;
  try {
    contract = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}. ${error.message}`);
  }
  const version = contract?.version;
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`${path} has an invalid contract version`);
  }
  return version;
}

try {
  const localPath = publicContractPath(process.argv.slice(2));
  const publicLocation = localPath ?? publicRef;
  const cms = readFileSync(new URL(cmsPath, cmsRoot));
  const published = readPublicContract(localPath);

  const cmsVersion = readVersion(cms, cmsPath);
  const publicVersion = readVersion(published, publicLocation);
  if (cmsVersion !== publicVersion) {
    throw new Error(`Version mismatch: ${cmsPath} v${cmsVersion} and ${publicLocation} v${publicVersion}`);
  }
  if (!cms.equals(published)) {
    throw new Error(`Byte mismatch: ${cmsPath} and ${publicLocation} both use v${cmsVersion}`);
  }

  console.log(`Hero media contract v${cmsVersion} matches between ${cmsPath} and ${publicLocation}.`);
} catch (error) {
  console.error(`Hero media contract check failed: ${error.message}`);
  process.exitCode = 1;
}
