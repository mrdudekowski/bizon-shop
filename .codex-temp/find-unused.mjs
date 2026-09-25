import fs from "fs";
import path from "path";

const ROOT = path.resolve("src");
const SKIP_DIRS = new Set(["node_modules", ".next"]);

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
const contents = new Map(
  files.map((f) => [f, fs.readFileSync(f, "utf8")])
);

function moduleId(file) {
  return file
    .replace(/\\/g, "/")
    .replace(/^.*?\/src\//, "@/")
    .replace(/\.(tsx?|jsx?)$/, "");
}

function isAppEntry(file) {
  const rel = file.replace(/\\/g, "/");
  return (
    /\/app\//.test(rel) &&
    /(page|layout|route|error|not-found|loading|template|manifest|sitemap|opengraph-image|robots)\.(tsx?|jsx?)$/.test(
      rel
    )
  );
}

function isReferenced(file) {
  if (isAppEntry(file)) return true;
  if (/\.test\.(tsx?|jsx?)$/.test(file)) return true;
  if (/payload-types\.ts$|payload\.config\.ts$|vitest\.config\.ts$|migrations\/index\.ts$|collections\/index\.ts$/.test(file.replace(/\\/g, "/")))
    return true;

  const id = moduleId(file);
  const base = path.basename(file).replace(/\.(tsx?|jsx?)$/, "");
  const folder = path.basename(path.dirname(file));
  let hits = 0;

  for (const [other, text] of contents) {
    if (other === file) continue;
    if (text.includes(id)) {
      hits++;
      continue;
    }
    // relative imports of same basename in sibling folders are noisy; require folder or exact path fragments
    const patterns = [
      `/${folder}/${base}`,
      `./${base}`,
      `../${base}`,
      `@/components/${folder}/${base}`,
      `@/hooks/${base}`,
      `@/lib/${folder}/${base}`,
      `@/constants/${base}`,
    ];
    if (patterns.some((p) => text.includes(p))) hits++;
  }
  return hits > 0;
}

const unused = files
  .filter((f) => !isReferenced(f))
  .map((f) => f.replace(/\\/g, "/").replace(/^.*?\/src\//, "src/"))
  .sort();

console.log(unused.join("\n"));
console.log("--- count", unused.length);
