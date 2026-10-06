// check-package-names.mjs が、本文とコードブロックの両方の語を検出し、許す語を通すことを確かめる。
// 実行: node --test scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const script = fileURLToPath(new URL("./check-package-names.mjs", import.meta.url));

function run(body, pkg = "x") {
  const dir = mkdtempSync(join(tmpdir(), "names-"));
  mkdirSync(join(dir, `packages/${pkg}/skills/s`), { recursive: true });
  writeFileSync(join(dir, `packages/${pkg}/skills/s/SKILL.md`), body);
  try {
    return { status: 0, out: execFileSync("node", [script, "packages"], { cwd: dir, encoding: "utf8" }) };
  } catch (e) {
    return { status: e.status, out: e.stdout + e.stderr };
  }
}

test("本文とコードブロックの両方で語を検出する", () => {
  const r = run("GitHub で進める。\n\n```sh\npnpm install\n```\n\n`npm test` も。\n");
  assert.equal(r.status, 1);
  assert.match(r.out, /:1:1: GitHub => ホスティングサービス/);
  assert.match(r.out, /:4:1: pnpm => パッケージマネージャー/);
  assert.match(r.out, /:7:2: npm => パッケージマネージャー/);
});

test("許す語と、語を含む別の語は通す", () => {
  const r = run("release-please か changesets を選ぶ。スキル setup-agent-harness を呼ぶ。\n");
  assert.equal(r.status, 0, r.out);
});

test("パッケージ global は対象にしない", () => {
  const r = run("GitHub で進める。\n", "global");
  assert.equal(r.status, 0, r.out);
});
