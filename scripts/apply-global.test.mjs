// apply-global.mjs が、packages/global の変更がなければ何もせず、user scope のマニフェストにパッケージがなければ配置を飛ばすことを確かめる。
// 実行: node --test scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./apply-global.mjs", import.meta.url));

function repo() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "apply-global-")));
  const git = (...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd: dir });
  git("init", "-q");
  writeFileSync(join(dir, "README.md"), "x\n");
  git("add", ".");
  git("commit", "-qm", "a");
  mkdirSync(join(dir, "packages/global"), { recursive: true });
  writeFileSync(join(dir, "packages/global/apm.yml"), "name: global\n");
  git("add", ".");
  git("commit", "-qm", "b");
  return dir;
}

function run(dir, home, ...args) {
  return spawnSync("node", [script, ...args], { cwd: dir, encoding: "utf8", env: { ...process.env, HOME: home } });
}

test("packages/global が変わっていなければ、何も出さずに終わる", () => {
  const dir = repo();
  const r = run(dir, dir, "HEAD~1", "HEAD~1");
  assert.equal(r.status, 0);
  assert.equal(r.stderr, "");
});

test("user scope のマニフェストにパッケージがなければ、配置を飛ばす", () => {
  const dir = repo();
  const home = mkdtempSync(join(tmpdir(), "apply-global-home-"));
  mkdirSync(join(home, ".apm"));
  writeFileSync(join(home, ".apm/apm.yml"), "dependencies:\n  apm: []\n");
  const r = run(dir, home, "HEAD~1", "HEAD");
  assert.equal(r.status, 0);
  assert.match(r.stderr, /配置を飛ばす/);
});
