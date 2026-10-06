// blob_link.py が、終了コードごとに URL と警告を出し分け、選んだ remote にあるコミットだけを push 済みとみなすことを確かめる。
// 実行: node --test packages/global/skills/write-survey-result/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./blob_link.py", import.meta.url));

function repo() {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "blob-link-")));
  const git = (...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], { cwd: dir, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  writeFileSync(join(dir, "a.py"), "x\n");
  git("add", ".");
  git("commit", "-qm", "a");
  git("remote", "add", "origin", "git@github.com:o/r.git");
  git("remote", "add", "other", "git@github.com:o/other.git");
  return { dir, git, sha: git("rev-parse", "HEAD") };
}

function run(dir, ...args) {
  return spawnSync("python3", [script, ...args], { cwd: dir, encoding: "utf8" });
}

test("選んだ remote にあるコミットなら、URL を出して 0 で終わる", () => {
  const { dir, git, sha } = repo();
  git("update-ref", "refs/remotes/origin/main", sha);
  const r = run(dir, "a.py", "1-2");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), `https://github.com/o/r/blob/${sha}/a.py#L1-L2`);
});

test("コミットが選んでいない remote にしかなければ、URL を出して 3 で終わる", () => {
  const { dir, git, sha } = repo();
  git("update-ref", "refs/remotes/other/main", sha);
  const r = run(dir, "a.py");
  assert.equal(r.status, 3);
  assert.equal(r.stdout.trim(), `https://github.com/o/r/blob/${sha}/a.py`);
  assert.match(r.stderr, /origin/);
});

test("remote がなければ、1 で終わる", () => {
  const { dir } = repo();
  const r = run(dir, "a.py", "--remote", "missing");
  assert.equal(r.status, 1);
  assert.equal(r.stdout, "");
});

test("行の範囲が逆なら、2 で終わる", () => {
  const { dir } = repo();
  const r = run(dir, "a.py", "5-2");
  assert.equal(r.status, 2);
});

test("URL の組み立ての自己テストが通る", () => {
  const r = spawnSync("python3", [script, "--selftest"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});
