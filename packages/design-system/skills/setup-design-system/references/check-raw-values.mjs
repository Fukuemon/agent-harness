#!/usr/bin/env node
// 画面とコンポーネントのコードに、色の値と基本の段の変数の名前が直に書かれていないかを確認する。
// 写した後に、TARGETS、EXCLUDES、BASE_PREFIXES を、自分のリポジトリに合わせて書き換える。
// 使い方: node check-raw-values.mjs [--prefix <基本の段の接頭辞>]... [--exclude <パス>]... [ファイルかディレクトリ]...
//   引数のパスを省くと TARGETS を読む。--prefix と --exclude を渡すと、BASE_PREFIXES と EXCLUDES の代わりに使う。
//   ディレクトリは、EXTENSIONS の拡張子のファイルを再帰で読む。node_modules と、. で始まるディレクトリは読まない。
// 見つけるもの: 16 進の色（#fff、#ffffff、#ffffff80）、色の関数（rgb()、hsl()、oklch() など）、BASE_PREFIXES で始まる変数の名前。
//   コメント（/* */、<!-- -->、行の // の後）の中は見ない。issue の番号のような # を色と取り違えないためである。
//   ALLOW_MARK を含む行は見ず、外した行の数を出す。外す理由は、同じ行のコメントに書く。
//   CSS の id のセレクタと private のフィールドの宣言で、16 進に見える名前（#add、#fade）は色と取り違える。その行は ALLOW_MARK で外す。
// 終了コード: 0 は見つからなかった、1 は見つかった、2 はパスが読めないか、引数が正しくない
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

// 画面とコンポーネントのコードの置き場
const TARGETS = ["./src"];
// トークンの段のファイルのように、値と基本の段の名前を持ってよい置き場
const EXCLUDES = ["./src/tokens"];
// 基本の段の変数の名前の接頭辞
const BASE_PREFIXES = ["--base-"];
const EXTENSIONS = [".css", ".scss", ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".astro", ".html", ".mdx"];
const ALLOW_MARK = "design-system-allow";

const prefixes = [];
const excludes = [];
const paths = [];
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--prefix" || arg === "--exclude") {
    const value = process.argv[++i];
    if (value === undefined || value === "") {
      console.error(`${arg} の次に値が要る`);
      process.exit(2);
    }
    (arg === "--prefix" ? prefixes : excludes).push(value);
  } else paths.push(arg);
}
const basePrefixes = prefixes.length ? prefixes : BASE_PREFIXES;
const excluded = (excludes.length ? excludes : EXCLUDES).map((p) => resolve(p));

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patterns = [
  // 直前が語の文字、&（文字参照）、.（private のフィールド）なら色にしない
  { label: "色の値", re: /(?<![\w&.#-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g },
  { label: "色の関数", re: /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g },
  ...basePrefixes.map((p) => ({ label: "基本の段の名前", re: new RegExp(`${escape(p)}[\\w-]+`, "g") })),
];

const isExcluded = (abs) => excluded.some((e) => abs === e || abs.startsWith(e + sep));

const files = [];
const collect = (p) => {
  const abs = resolve(p);
  if (isExcluded(abs)) return;
  let stat;
  try {
    stat = statSync(abs);
  } catch (e) {
    console.error(`読めない: ${p}\n${e.message}`);
    process.exit(2);
  }
  if (stat.isDirectory()) {
    for (const name of readdirSync(abs).sort()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const child = join(abs, name);
      if (statSync(child).isDirectory() || EXTENSIONS.includes(extname(name))) collect(child);
    }
  } else files.push(abs);
};
for (const p of paths.length ? paths : TARGETS) collect(p);

// コメントを空白に置き換える。改行は残し、行の番号をずらさない
const blank = (s) => s.replace(/[^\n]/g, " ");
const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    // : の直後の // は URL の一部なので、コメントにしない
    .replace(/(^|[^:\\])\/\/[^\n]*/gm, (m, head) => head + blank(m.slice(head.length)));

let found = 0;
let allowed = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (e) {
    console.error(`読めない: ${relative(".", file)}\n${e.message}`);
    process.exit(2);
  }
  const original = text.split("\n");
  const code = stripComments(text).split("\n");
  code.forEach((line, i) => {
    if (original[i].includes(ALLOW_MARK)) {
      allowed++;
      return;
    }
    for (const { label, re } of patterns) {
      for (const m of line.matchAll(re)) {
        found++;
        console.log(`${relative(".", file)}:${i + 1}: ${label} ${m[0]}`);
      }
    }
  });
}

if (allowed) console.log(`${ALLOW_MARK} で外した行: ${allowed}`);
if (found) {
  console.log(`${found} か所に、色の値か基本の段の名前がある。意味の段かテーマの段の名前に替える`);
  process.exit(1);
}
console.log(`${files.length} 個のファイルに、色の値と基本の段の名前はなかった`);
