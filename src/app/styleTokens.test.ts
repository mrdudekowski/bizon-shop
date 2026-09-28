import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("..", import.meta.url));
const GLOBALS = fileURLToPath(new URL("./globals.css", import.meta.url));

const REQUIRED_TOKENS = [
  "--tracking-display",
  "--tracking-title",
  "--tracking-body",
  "--tracking-kicker",
  "--tracking-label",
  "--tracking-brand",
  "--type-hero",
  "--type-display",
  "--type-title",
  "--type-lead",
  "--type-kicker",
  "--leading-display",
  "--leading-body",
  "--weight-display",
  "--weight-kicker",
  "--color-on-dark",
  "--color-surface-inverse",
  "--media-fit-cover",
  "--overlay-photo",
  "--radius-card-inner",
];

function cssFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) cssFiles(path, acc);
    else if (entry.name.endsWith(".css")) acc.push(path);
  }
  return acc;
}

describe("site style tokens", () => {
  const globals = readFileSync(GLOBALS, "utf8");

  it("declares the type SSOT in :root", () => {
    for (const token of REQUIRED_TOKENS) {
      expect(globals.includes(`${token}:`), token).toBe(true);
    }
  });

  it("does not hardcode letter-spacing in site CSS", () => {
    const leftover: string[] = [];
    for (const file of cssFiles(SRC)) {
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        if (!/letter-spacing\s*:/.test(line)) return;
        if (/letter-spacing\s*:\s*var\(--tracking-/.test(line)) return;
        leftover.push(`${file.replace(`${SRC}\\`, "").replace(`${SRC}/`, "")}:${index + 1} ${line.trim()}`);
      });
    }
    expect(leftover, leftover.join("\n")).toEqual([]);
  });
});
