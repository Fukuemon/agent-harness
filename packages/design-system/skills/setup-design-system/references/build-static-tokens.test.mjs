// build-static-tokens.mjs が、@import の行を外して元の CSS を順に並べ、--check で生成物のずれを終了コード 1 で報告することを確かめる。
// 実行: node --test "packages/design-system/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./build-static-tokens.mjs", import.meta.url));

const setup = () => {
  const dir = mkdtempSync(join(tmpdir(), "build-static-tokens-"));
  // 基本の段はパッケージから読む形にし、package.json からの解決も通す
  mkdirSync(join(dir, "node_modules/base-tokens/dist"), { recursive: true });
  writeFileSync(join(dir, "package.json"), '{ "name": "app", "private": true }\n');
  writeFileSync(join(dir, "node_modules/base-tokens/package.json"), '{ "name": "base-tokens" }\n');
  writeFileSync(join(dir, "node_modules/base-tokens/dist/tokens.css"), ":root { --base-white: #ffffff; }\n");
  mkdirSync(join(dir, "src/tokens"), { recursive: true });
  writeFileSync(join(dir, "src/tokens/semantic.css"), "@import 'base-tokens/dist/tokens.css';\n\n:root { --app-color-surface: var(--base-white); }\n");
  return dir;
};
const run = (dir, ...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: "utf8" });
const ARGS = ["--out", "docs/screens/_common/tokens.css", "base-tokens/dist/tokens.css", "./src/tokens/semantic.css"];

test("@import の行を外し、基本の段と意味の段を順に並べて書き出す", () => {
  const dir = setup();
  const r = run(dir, ...ARGS);
  assert.equal(r.status, 0, r.stderr);
  const out = readFileSync(join(dir, "docs/screens/_common/tokens.css"), "utf8");
  assert.match(out, /^\/\*\n \* 生成物。手で直さない。/);
  assert.doesNotMatch(out, /@import/);
  assert.ok(out.indexOf("--base-white: #ffffff") < out.indexOf("--app-color-surface"));
});

test("--check は、生成物が元と一致すれば 0、食い違えば 1 で終わる", () => {
  const dir = setup();
  run(dir, ...ARGS);
  assert.equal(run(dir, "--check", ...ARGS).status, 0);
  writeFileSync(join(dir, "src/tokens/semantic.css"), ":root { --app-color-surface: #fafafa; }\n");
  const r = run(dir, "--check", ...ARGS);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /食い違う/);
});

test("--check は、生成物がなければ 1 で終わる", () => {
  const r = run(setup(), "--check", ...ARGS);
  assert.equal(r.status, 1);
});

test("行の途中に @import が残れば、2 で終わる", () => {
  const dir = setup();
  writeFileSync(join(dir, "src/tokens/semantic.css"), ":root { --a: #fff; } @import 'x.css';\n");
  assert.equal(run(dir, ...ARGS).status, 2);
});

test("コメントの中の @import は、残った @import として扱わない", () => {
  const dir = setup();
  writeFileSync(join(dir, "src/tokens/semantic.css"), "/* 基本の段は @import で読む */\n:root { --a: #fff; }\n");
  assert.equal(run(dir, ...ARGS).status, 0);
});

test("--out か元の CSS がなければ、2 で終わる", () => {
  const dir = setup();
  assert.equal(run(dir, "./src/tokens/semantic.css").status, 2);
  assert.equal(run(dir, "--out", "x.css").status, 2);
});
