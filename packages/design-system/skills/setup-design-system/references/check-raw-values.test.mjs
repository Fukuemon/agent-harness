// check-raw-values.mjs が、画面のコードの色の値と基本の段の名前で 1 を、意味の段とテーマの段の名前だけのコードで 0 を返すことを確認する。
// 実行: node --test "packages/design-system/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./check-raw-values.mjs", import.meta.url));

// files の { 相対パス: 中身 } を一時のディレクトリに書き、そこで script を流す
const run = (files, args = []) => {
  const dir = mkdtempSync(join(tmpdir(), "check-raw-values-"));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), body);
  }
  return spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: "utf8" });
};

const CLEAN = `export const Card = () => (
  <div className="bg-surface text-text focus-ring" style={{ color: "var(--app-color-text)" }} />
);
`;

test("意味の段とテーマの段の名前だけなら 0", () => {
  const r = run({ "src/Card.tsx": CLEAN });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /1 個のファイル/);
});

test("16 進の色、色の関数、基本の段の名前を、ファイルと行と一緒に出して 1", () => {
  const r = run({
    "src/a.css": ".a {\n  color: #1a1a1a;\n  border-color: #fff8;\n}\n",
    "src/b.tsx": 'const s = { background: "rgb(0 0 0 / 50%)", color: "oklch(0.5 0.1 200)" };\n',
    "src/c.tsx": '<p className="text-[var(--base-gray-800)]" />\n',
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /src\/a\.css:2: 色の値 #1a1a1a/);
  assert.match(r.stdout, /src\/a\.css:3: 色の値 #fff8/);
  assert.match(r.stdout, /src\/b\.tsx:1: 色の関数 rgb\(/);
  assert.match(r.stdout, /src\/b\.tsx:1: 色の関数 oklch\(/);
  assert.match(r.stdout, /src\/c\.tsx:1: 基本の段の名前 --base-gray-800/);
  assert.match(r.stdout, /5 か所/);
});

test("コメントの中の # と色は見ない。行の番号はずれない", () => {
  const body = [
    "/* 古い値は #000000 だった",
    "   rgb(0, 0, 0) も使っていた */",
    "// #123 の対応",
    '<!-- #fff -->',
    'const url = "https://example.com/#top";',
    "const red = '#ff0000';",
  ].join("\n");
  const r = run({ "src/x.tsx": body });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /src\/x\.tsx:6: 色の値 #ff0000/);
  assert.doesNotMatch(r.stdout, /#000000|#123|#fff\b|#top|rgb\(/);
});

test("文字参照、private のフィールド、16 進でない # は色にしない", () => {
  const r = run({ "src/y.ts": "class A { f() { return this.#add + '&#123;' + '#app'; } }\n" });
  assert.equal(r.status, 0, r.stdout);
});

test("ALLOW_MARK の行は見ず、外した数を出す", () => {
  const r = run({ "src/z.css": ".brand { color: #00118f; } /* design-system-allow: ロゴの色は利用規約で決まっている */\n" });
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /外した行: 1/);
});

test("既定の EXCLUDES のトークンの置き場と、node_modules と . で始まるディレクトリは読まない", () => {
  const r = run({
    "src/tokens/base.css": ":root { --base-white: #ffffff; }\n",
    "src/node_modules/pkg/index.css": ".a { color: #000; }\n",
    "src/.cache/a.css": ".a { color: #000; }\n",
    "src/readme.txt": "#000\n",
    "src/ok.css": ".a { color: var(--app-color-text); }\n",
  });
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /1 個のファイル/);
});

test("--prefix と --exclude と引数のパスで、既定の値を替える", () => {
  const files = {
    "app/ui/a.css": ".a { color: var(--color-primitive-blue-500); }\n",
    "app/tokens/semantic.css": ":root { --app-color-primary: var(--color-key-900); }\n",
  };
  const r = run(files, ["--prefix", "--color-primitive-", "--prefix", "--color-key-", "--exclude", "app/tokens", "app"]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /app\/ui\/a\.css:1: 基本の段の名前 --color-primitive-blue-500/);
  assert.doesNotMatch(r.stdout, /semantic\.css/);
});

test("読めないパスと、値のない --prefix で 2", () => {
  assert.equal(run({}, ["missing"]).status, 2);
  assert.equal(run({ "src/a.css": "" }, ["--prefix"]).status, 2);
});

test("引用符の中の // と /* はコメントにしない。CSS の // もコメントにしない", () => {
  const r = run({
    "src/img.tsx": '<img src="//cdn.example.com/logo.svg" style={{ color: "#ff0000" }} />\n',
    "src/s.ts": 'const a = "/* not a comment"; const b = "#00ff00"; // */\n',
    "src/u.css": ".a { background: url(//cdn.example.com/a.png); color: #0000ff; }\n",
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /src\/img\.tsx:1: 色の値 #ff0000/);
  assert.match(r.stdout, /src\/s\.ts:1: 色の値 #00ff00/);
  assert.match(r.stdout, /src\/u\.css:1: 色の値 #0000ff/);
});

test("color() を色の関数として見つけ、メソッドの .color() は見ない", () => {
  const r = run({
    "src/p3.css": ".card { color: color(display-p3 1 0 0); }\n",
    "src/m.ts": "chart.color(series);\n",
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /src\/p3\.css:1: 色の関数 color\(/);
  assert.doesNotMatch(r.stdout, /m\.ts/);
});
