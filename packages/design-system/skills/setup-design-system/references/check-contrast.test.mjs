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

const run = (semanticCss, baseCss = BASE) => {
  const dir = mkdtempSync(join(tmpdir(), "check-contrast-"));
  mkdirSync(join(dir, "src/tokens"), { recursive: true });
  writeFileSync(join(dir, "src/tokens/base.css"), baseCss);
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

test("コメントの中の宣言は、今の値として読まない", () => {
  const css = `${semantic({ "text-secondary": "#999999" })}/* 前の値: --app-color-text-secondary: #666666; */\n`;
  const r = run(css);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text-secondary は surface の上で 2\.85:1/);
});

test("ブロックの最後の、セミコロンのない宣言も読む", () => {
  const r = run(`${semantic()}:root { --app-color-text-secondary: #999999 }\n`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text-secondary は surface の上で 2\.85:1/);
});

test("条件つきのブロックの中の宣言があれば、確認できないと報告して 1 で終わる", () => {
  const r = run(`${semantic({ "text-secondary": "#999999" })}@media print { :root { --app-color-text-secondary: #666666; } }\n`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /条件つきのブロック/);
  assert.match(r.stderr, /@media print :root の --app-color-text-secondary/);
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
  assert.match(r.stderr, /primary の値 rgb\(29 78 216\) は 16 進の色でない/);
});

test("CSS が読めなければ、2 で終わる", () => {
  const r = spawnSync(process.execPath, [script, "./missing.css"], { cwd: tmpdir(), encoding: "utf8" });
  assert.equal(r.status, 2);
});

test("基本の段をパッケージのパスから読む", () => {
  const dir = mkdtempSync(join(tmpdir(), "check-contrast-"));
  mkdirSync(join(dir, "node_modules/base-tokens/dist"), { recursive: true });
  writeFileSync(join(dir, "package.json"), '{ "name": "app", "private": true }\n');
  writeFileSync(join(dir, "node_modules/base-tokens/package.json"), '{ "name": "base-tokens" }\n');
  writeFileSync(join(dir, "node_modules/base-tokens/dist/tokens.css"), BASE);
  writeFileSync(join(dir, "semantic.css"), semantic());
  const r = spawnSync(process.execPath, [script, "base-tokens/dist/tokens.css", "./semantic.css"], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});

test(":root, :host のセレクタと @layer の中の :root は、画面に効く値として読む", () => {
  const base = BASE.replace(":root {", "@layer base { :root, :host {").replace(/}\n$/, "} }\n");
  const r = run(semantic({ "text-secondary": "#999999" }).replace(":root {", ":root, :host {"), base);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text-secondary は surface の上で 2\.85:1/);
});

test("基本の段の、:root 以外のブロックの宣言は読み飛ばして数を出す", () => {
  const r = run(semantic(), `${BASE}[data-theme=dark] { --base-white: #000000; }\n`);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /基本の段の宣言を 1 個読み飛ばした/);
});

test("var() の循環は、16 進でない値と別のメッセージで報告する", () => {
  const r = run(semantic({ text: "var(--app-color-text-loop)", "text-loop": "var(--app-color-text)" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text の参照が --app-color-text-loop で循環する|text の参照が --app-color-text で循環する/);
});

test("フォールバックのある var()、空白のある var()、#rgb、!important を読む", () => {
  const r = run(semantic({ text: "var( --base-undefined, #111 )", "text-secondary": "var( --base-gray-600 ) !important" }));
  assert.equal(r.status, 0, r.stderr);
});

test("--root で渡したブロックは、:root の後の値として読む", () => {
  const css = `${semantic()}[data-theme=dark] { --app-color-text-secondary: #999999; }\n`;
  assert.equal(run(css).status, 1);
  const dir = mkdtempSync(join(tmpdir(), "check-contrast-"));
  writeFileSync(join(dir, "base.css"), BASE);
  writeFileSync(join(dir, "semantic.css"), css);
  const r = spawnSync(process.execPath, [script, "--root", "[data-theme=dark]", "./base.css", "./semantic.css"], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text-secondary は surface の上で 2\.85:1/);
});

test("@media の中の :root を含むセレクタの並びは、条件つきとして報告する", () => {
  const r = run(`${semantic({ "text-secondary": "#999999" })}@media print { :host, :root { --app-color-text-secondary: #666666; } }\n`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /条件つきのブロック/);
});

test("!important の値は、後の通常の宣言に上書きされない", () => {
  const r = run(`${semantic({ "text-secondary": "#999999 !important" })}:root { --app-color-text-secondary: #666666; }\n`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text-secondary は surface の上で 2\.85:1/);
});

test("--root で 1 つのテーマを選ぶと、ほかのテーマのブロックは読み飛ばす", () => {
  const css = `${semantic()}[data-theme=light] { --app-color-text: #1a1a1a; }\n[data-theme=dark] { --app-color-text-secondary: #999999; }\n`;
  const dir = mkdtempSync(join(tmpdir(), "check-contrast-"));
  writeFileSync(join(dir, "base.css"), BASE);
  writeFileSync(join(dir, "semantic.css"), css);
  const light = spawnSync(process.execPath, [script, "--root", "[data-theme=light]", "./base.css", "./semantic.css"], { cwd: dir, encoding: "utf8" });
  assert.equal(light.status, 0, light.stderr);
  assert.match(light.stderr, /--root の外の条件つきのブロックにある意味の段の宣言を 1 個読み飛ばした/);
  const dark = spawnSync(process.execPath, [script, "--root", "[data-theme=dark]", "./base.css", "./semantic.css"], { cwd: dir, encoding: "utf8" });
  assert.equal(dark.status, 1);
  assert.match(dark.stderr, /text-secondary は surface の上で 2\.85:1/);
});

test("通常の宣言は、@layer の中より外が、前の layer より後の layer が勝つ", () => {
  const unlayered = run(`${semantic({ "text-secondary": "#999999" })}@layer base { :root { --app-color-text-secondary: #666666; } }\n`);
  assert.equal(unlayered.status, 1);
  assert.match(unlayered.stderr, /text-secondary は surface の上で 2\.85:1/);
  const ordered = run(`@layer base, theme;\n@layer theme { :root { --app-color-text-secondary: #999999; } }\n@layer base { ${semantic().replace(/\n/g, " ")} }\n`);
  assert.equal(ordered.status, 1);
  assert.match(ordered.stderr, /text-secondary は surface の上で 2\.85:1/);
});

test("!important は、@layer の順が逆になる", () => {
  const css = `@layer base, theme;\n${semantic()}@layer base { :root { --app-color-text-secondary: #999999 !important; } }\n@layer theme { :root { --app-color-text-secondary: #666666 !important; } }\n`;
  const r = run(css);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text-secondary は surface の上で 2\.85:1/);
});

test("--root で渡したブロックは、後の :root の宣言より優先する", () => {
  const dir = mkdtempSync(join(tmpdir(), "check-contrast-"));
  writeFileSync(join(dir, "base.css"), BASE);
  writeFileSync(join(dir, "semantic.css"), `:root[data-theme=dark] { --app-color-text-secondary: #999999; }\n${semantic()}`);
  const r = spawnSync(process.execPath, [script, "--root", ":root[data-theme=dark]", "./base.css", "./semantic.css"], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /text-secondary は surface の上で 2\.85:1/);
});
