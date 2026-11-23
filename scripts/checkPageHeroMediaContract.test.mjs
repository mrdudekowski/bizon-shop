import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

const cmsPath = "src/admin/pages/pageHeroMediaContract.json";
const publicPath = "src/lib/content/pageHeroMediaContract.json";
const remoteRef = "refs/remotes/origin/main-app";
const matchingSource = '{\n  "version": 1\n}\n';

function fixture(t) {
  const tempRoot = realpathSync(tmpdir());
  const root = mkdtempSync(join(tempRoot, "bizon-hero-contract-"));
  t.after(() => {
    assert.equal(dirname(realpathSync(root)), tempRoot);
    rmSync(root, { recursive: true, force: true });
  });

  const script = join(root, "scripts/checkPageHeroMediaContract.mjs");
  const localPublicPath = join(root, "public checkout.json");
  for (const path of [cmsPath, publicPath, "scripts/checkPageHeroMediaContract.mjs"]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
  }
  copyFileSync(new URL("./checkPageHeroMediaContract.mjs", import.meta.url), script);
  writeFileSync(join(root, cmsPath), matchingSource);
  const git = (...args) => execFileSync("git", ["-c", "core.autocrlf=false", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  git("init", "--quiet");

  return {
    run: (...args) => execFileSync(process.execPath, [script, ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
    useRemoteTree(source) {
      if (source !== undefined) {
        writeFileSync(join(root, publicPath), source);
        git("add", "--", publicPath);
      }
      git("update-ref", remoteRef, git("write-tree"));
    },
    useLocalFile(source) {
      writeFileSync(localPublicPath, source);
      return localPublicPath;
    },
  };
}

function assertFailure(run, pattern) {
  assert.throws(run, (error) => {
    assert.equal(error.status, 1);
    assert.match(error.stderr, pattern);
    return true;
  });
}

test("compares the requested local file without a remote ref", (t) => {
  const { run, useLocalFile } = fixture(t);
  const path = useLocalFile(matchingSource);
  assert.match(run("--public-contract", path), /v1 matches/);
  assert.match(run("--public-contract", "public checkout.json"), /v1 matches/);
});

test("compares the public Git blob by default", (t) => {
  const { run, useRemoteTree } = fixture(t);
  useRemoteTree(matchingSource);
  assert.match(run(), /v1 matches.*origin\/main-app/);
});

test("reports how to provide the missing path argument", (t) => {
  const { run } = fixture(t);
  assertFailure(() => run("--public-contract"), /Usage:.*--public-contract <path>/);
});

test("rejects an unreadable local path even when the remote contract matches", (t) => {
  const { run, useRemoteTree } = fixture(t);
  useRemoteTree(matchingSource);
  assertFailure(() => run("--public-contract", "missing.json"), /Cannot read .*missing\.json/);
});

test("reports a missing public remote ref", (t) => {
  const { run } = fixture(t);
  assertFailure(run, /Cannot read origin\/main-app:src\/lib\/content\/pageHeroMediaContract\.json/);
});

test("reports a missing contract path in an existing remote tree", (t) => {
  const { run, useRemoteTree } = fixture(t);
  useRemoteTree();
  assertFailure(run, /Cannot read origin\/main-app:src\/lib\/content\/pageHeroMediaContract\.json/);
});

test("rejects a contract with an invalid version", (t) => {
  const { run, useLocalFile } = fixture(t);
  const path = useLocalFile('{"version":"1"}');
  assertFailure(() => run("--public-contract", path), /invalid contract version/);
});

test("reports both versions when they differ", (t) => {
  const { run, useRemoteTree } = fixture(t);
  useRemoteTree('{"version":2}');
  assertFailure(run, /Version mismatch: .*v1 and .*v2/);
});

test("rejects different bytes when the versions match", (t) => {
  const { run, useRemoteTree } = fixture(t);
  useRemoteTree('{"version":1}');
  assertFailure(run, /Byte mismatch: .*both use v1/);
});
