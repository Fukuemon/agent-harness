#!/usr/bin/env node
// 意味の段のトークンの組が、WCAG 2.2 のコントラスト比の基準に届くかを確認する。
// 写した後に、SOURCES、PREFIX、TEXT_PAIRS、NON_TEXT_PAIRS を、自分のトークンに合わせて書き換える。
// 使い方: node check-contrast.mjs [CSS のファイルかパッケージのパス]...
//   引数を省くと SOURCES を読む。パッケージのパス（`@scope/name/dist/tokens.css` の形）は、カレントディレクトリの package.json から解決する
// 終了コード: 0 は全部の組が基準に届いた、1 は届かない組か、色に解決できないトークンか、条件つきのブロックの中の宣言がある、2 は CSS が読めない
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute, join, resolve } from "node:path";

// 基本の段の CSS を先に、意味の段の CSS を後に並べる。同じ名前は後の値が勝つ
const SOURCES = ["./src/tokens/base.css", "./src/tokens/semantic.css"];
// 意味の段のトークンの接頭辞。組の名前に付けて CSS の変数の名前にする
const PREFIX = "--app-color-";

// 文字と、その下の面の組。4.5:1 以上
const TEXT_PAIRS = [
  ...["surface", "surface-canvas", "surface-subtle", "primary-surface"].flatMap((bg) => [
    ["text", bg],
    ["text-secondary", bg],
  ]),
  ["primary", "surface"],
  ["primary", "primary-surface"],
  ["text-inverse", "primary"],
  ...["danger", "warning", "success"].flatMap((state) => [
    [state, "surface"],
    [state, `${state}-surface`],
    ["text", `${state}-surface`],
  ]),
];

// 文字でないもの（入力欄と押せるものの枠、フォーカスの表示）と、その下の面の組。3:1 以上
const NON_TEXT_PAIRS = [
  ["border-field", "surface"],
  ["border-field", "surface-subtle"],
  ["primary", "surface"],
  ["focus-outline", "surface"],
  ["focus-outline", "focus-halo"],
];

const sources = process.argv.length > 2 ? process.argv.slice(2) : SOURCES;
const properties = new Map();
const conditional = [];
for (const source of sources) {
  let css;
  try {
    css = readFileSync(locate(source), "utf8");
  } catch (e) {
    console.error(`読めない: ${source}\n${e.message}`);
    process.exit(2);
  }
  // コメントに残した古い値や例の宣言を、今の値として読まない
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  readDeclarations(css, source);
}

if (conditional.length) {
  console.error(`条件つきのブロック（@media、:root 以外のセレクタなど）の中の宣言は確認できない。条件ごとの値を別の CSS に分け、別に流す\n${conditional.join("\n")}`);
  process.exit(1);
}

const failures = [];
const check = (pairs, minimum) => {
  for (const [fg, bg] of pairs) {
    try {
      const ratio = contrast(color(fg), color(bg));
      if (ratio < minimum) failures.push(`${fg} は ${bg} の上で ${ratio.toFixed(2)}:1。${minimum}:1 以上が要る`);
    } catch (e) {
      failures.push(e.message);
    }
  }
};
check(TEXT_PAIRS, 4.5);
check(NON_TEXT_PAIRS, 3);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`${TEXT_PAIRS.length + NON_TEXT_PAIRS.length} 組が基準に届いた`);

// 一番外の :root のブロックの宣言だけを、画面に効く値として読む。ほかのブロックの変数の宣言は conditional に残す
function readDeclarations(css, source) {
  const blocks = [];
  let text = "";
  const flush = () => {
    const m = /^(--[\w-]+)\s*:\s*([\s\S]+)$/.exec(text.trim());
    if (m && blocks.length === 1 && blocks[0] === ":root") properties.set(m[1], m[2].trim());
    else if (m && blocks.length) conditional.push(`${source}: ${blocks.join(" ")} の ${m[1]}`);
    text = "";
  };
  for (const ch of css) {
    if (ch === "{") {
      blocks.push(text.trim().replace(/\s+/g, " "));
      text = "";
    } else if (ch === "}") {
      flush();
      blocks.pop();
    } else if (ch === ";") flush();
    else text += ch;
  }
}

function locate(source) {
  if (isAbsolute(source) || source.startsWith(".")) return resolve(source);
  return createRequire(join(process.cwd(), "package.json")).resolve(source);
}

// var() の参照をたどり、6 桁の 16 進の色にする
function color(token) {
  let value = `var(${PREFIX}${token})`;
  for (let depth = 0; depth < 10; depth++) {
    const ref = /^var\((--[\w-]+)\)$/.exec(value);
    if (!ref) break;
    if (!properties.has(ref[1])) throw new Error(`${ref[1]} が定義されていない（${token}）`);
    value = properties.get(ref[1]);
  }
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`${token} の値 ${value} は 6 桁の 16 進の色でない`);
  return value;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
