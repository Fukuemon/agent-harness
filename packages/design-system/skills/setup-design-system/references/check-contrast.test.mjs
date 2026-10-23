// check-contrast.mjs が、既定の組を全部満たすトークンで 0 を、基準に届かない組と色に解決できないトークンで 1 を返すことを確かめる。
// 実行: node --test "packages/design-system/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./check-contrast.mjs", import.meta.url));

const BASE = `:root {
  --base-white: #ffffff;
  --base-gray-50: #f2f2f2;
  --base-gray-600: #666666;
  --base-gray-900: #1a1a1a;
  --base-blue-50: #e8f1fe;
  --base-blue-800: #1d4ed8;
  --base-red-50: #fdeeee;
  --base-red-900: #ce0000;
  --base-orange-50: #ffeee2;
  --base-orange-900: #ac3e00;
  --base-green-50: #e6f5ec;
  --base-green-800: #197a4b;
  --base-yellow-300: #ffd43d;
  --base-black: #000000;
}
`;

const semantic = (overrides = {}) => {
  const tokens = {
    surface: "var(--base-white)",
    "surface-canvas": "#fafafa",
    "surface-subtle": "var(--base-gray-50)",
    text: "var(--base-gray-900)",
    "text-secondary": "var(--base-gray-600)",
    "text-inverse": "var(--base-white)",
    "border-field": "var(--base-gray-600)",
    primary: "var(--base-blue-800)",
    "primary-surface": "var(--base-blue-50)",
    danger: "var(--base-red-900)",
    "danger-surface": "var(--base-red-50)",
    warning: "var(--base-orange-900)",
    "warning-surface": "var(--base-orange-50)",
    success: "var(--base-green-800)",
    "success-surface": "var(--base-green-50)",
    "focus-outline": "var(--base-black)",
    "focus-halo": "var(--base-yellow-300)",
    ...overrides,
  };
  return `:root {\n${Object.entries(tokens).map(([k, v]) => `  --app-color-${k}: ${v};`).join("\n")}\n}\n`;
};

const run = (semanticCss) => {
  const dir = mkdtempSync(join(tmpdir(), "check-contrast-"));
  mkdirSync(join(dir, "src/tokens"), { recursive: true });
  writeFileSync(join(dir, "src/tokens/base.css"), BASE);
  writeFileSync(join(dir, "src/tokens/semantic.css"), semanticCss);
  return spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
};

test("既定の組が全部基準に届けば、0 で終わる", () => {
  const r = run(semantic());
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /組が基準に届いた/);
});

test("文字の組が 4.5:1 に届かなければ、比を出して 1 で終わる", () => {
  const r = run(semantic({ "text-secondary": "#999999" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text-secondary は surface の上で 2\.85:1。4\.5:1 以上が要る/);
});

test("枠が 3:1 に届かなければ、1 で終わる", () => {
  const r = run(semantic({ "border-field": "#e9e9eb" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /border-field は surface の上で 1\.\d+:1。3:1 以上が要る/);
});

test("参照の先が定義されていなければ、名前を出して 1 で終わる", () => {
  const r = run(semantic({ danger: "var(--base-red-1000)" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--base-red-1000 が定義されていない/);
});

test("16 進でない値は、色に解決できないと報告して 1 で終わる", () => {
  const r = run(semantic({ primary: "rgb(29 78 216)" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /primary の値 rgb\(29 78 216\) は 6 桁の 16 進の色でない/);
});

test("CSS が読めなければ、2 で終わる", () => {
  const r = spawnSync(process.execPath, [script, "./missing.css"], { cwd: tmpdir(), encoding: "utf8" });
  assert.equal(r.status, 2);
});
