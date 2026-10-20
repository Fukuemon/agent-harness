// render-drawio-svg.mjs が、引数と入力の誤りを 1 で、描画の失敗を 2 で止めることを確かめる。
// 実行: node --test packages/global/skills/draw-architecture-diagram/scripts/render-drawio-svg.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./render-drawio-svg.mjs", import.meta.url));
const model = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';

function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
}

test("引数が足りなければ、使い方を出して 1 で終わる", () => {
  const r = run([]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /使い方/);
});

test("入力に mxGraphModel が無ければ、1 で終わる", () => {
  const dir = mkdtempSync(join(tmpdir(), "render-drawio-svg-"));
  const input = join(dir, "a.drawio");
  writeFileSync(input, '<mxfile><diagram id="a">dZBNC4</diagram></mxfile>');
  const r = run([input, join(dir, "a.svg")]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /mxGraphModel/);
});

test("agent-browser が無ければ、出力せずに 2 で終わる", () => {
  const dir = mkdtempSync(join(tmpdir(), "render-drawio-svg-"));
  const input = join(dir, "a.drawio");
  writeFileSync(input, `<mxfile><diagram id="a">${model}</diagram></mxfile>`);
  const r = run([input, join(dir, "a.svg")], { AGENT_BROWSER_CMD: join(dir, "missing-command") });
  assert.equal(r.status, 2);
  assert.equal(existsSync(join(dir, "a.svg")), false);
});

test("編集できる SVG を入力にしても、content 属性から mxGraphModel を取り出す", () => {
  const dir = mkdtempSync(join(tmpdir(), "render-drawio-svg-"));
  const input = join(dir, "a.svg");
  const escaped = model.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  writeFileSync(input, `<svg xmlns="http://www.w3.org/2000/svg" content="${escaped}"><g/></svg>`);
  // 取り出しに成功すれば描画へ進み、存在しないコマンドで 2 になる。取り出しに失敗すれば 1 になる
  const r = run([input, join(dir, "b.svg")], { AGENT_BROWSER_CMD: join(dir, "missing-command") });
  assert.equal(r.status, 2);
});

test("--inline-icons を付けても、入力を読んで描画へ進む", () => {
  const dir = mkdtempSync(join(tmpdir(), "render-drawio-svg-"));
  const input = join(dir, "a.drawio");
  writeFileSync(input, `<mxfile><diagram id="a">${model}</diagram></mxfile>`);
  // オプションを引数の誤りとして扱えば 1、受け付ければ存在しないコマンドで 2 になる
  const r = run([input, join(dir, "a.svg"), "--inline-icons"], { AGENT_BROWSER_CMD: join(dir, "missing-command") });
  assert.equal(r.status, 2);
});
