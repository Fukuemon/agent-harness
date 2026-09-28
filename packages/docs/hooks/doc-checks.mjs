// 経緯の混入とリンクのチェック。編集後のフック check-docs.mjs と、scripts/ の check-history.mjs と check-links.mjs が読み込む。
// パッケージマネージャーは hooks/ だけを利用者のリポジトリへ写すので、処理はここに置く
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HISTORY = /変更履歴|更新履歴|改訂履歴|\bhistory\b|\bchangelog\b/i;
const ISSUE = /(^|[\s(（、。])#(\d+)\b/g;

/** Markdown の frontmatter の type を返す。frontmatter がなければ undefined。 */
export function docType(text) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
  return block && /^type:[ \t]*["']?([\w-]+)/m.exec(block)?.[1];
}

/** 経緯の混入を見る文書か。Design Doc と context が当たる。 */
export function isHistoryTarget(text) {
  return ["design-doc", "feature-design", "context"].includes(docType(text));
}

/**
 * 変更履歴に当たる見出しと、issue の番号を返す。
 * 見出しは失敗として、番号は閉じているかを確かめるための一覧として、kind で分ける。
 */
export function historyFindings(text) {
  const out = [];
  for (const { no, line } of proseLines(text)) {
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading && HISTORY.test(heading[1])) out.push({ kind: "heading", line: no, text: line.trim() });
    else for (const m of line.replace(/`[^`]*`/g, "").matchAll(ISSUE)) out.push({ kind: "issue", line: no, text: `#${m[2]}` });
  }
  return out;
}

/** 相対リンクの先のファイルと、見出しのアンカーが存在しないリンクを返す。file は、リンクを解決する基準の文書のパス。 */
export function brokenLinks(file, text) {
  const out = [];
  for (const { no, line } of proseLines(text)) {
    const prose = line.replace(/`[^`]*`/g, "");
    const inline = [...prose.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => m[1]);
    const reference = /^ {0,3}\[[^\]]+\]:\s*(\S+)/.exec(prose)?.[1];
    for (const target of reference ? [...inline, reference] : inline) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("<")) continue;
      const [path, anchor] = target.split("#");
      const dest = path ? resolve(dirname(file), decodeURIComponent(path)) : file;
      if (!existsSync(dest)) out.push({ line: no, target, reason: "ファイルがない" });
      else if (anchor && statSync(dest).isFile() && dest.endsWith(".md") && !anchors(readFileSync(dest, "utf8")).has(decodeURIComponent(anchor).toLowerCase())) {
        out.push({ line: no, target, reason: "見出しがない" });
      }
    }
  }
  return out;
}

// GitHub と同じ規則で、見出しからアンカーを作る。同じ見出しには -1、-2 を付ける
function anchors(text) {
  const seen = new Map();
  const out = new Set();
  for (const { line } of proseLines(text)) {
    const h = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!h) continue;
    const base = h[1].toLowerCase().replace(/`/g, "").replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "").replace(/\s/g, "-");
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.add(n ? `${base}-${n}` : base);
  }
  return out;
}

function proseLines(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let i = 0;
  if (lines[0] === "---") {
    i = lines.indexOf("---", 1) + 1;
    if (i === 0) i = lines.length;
  }
  let fence = "";
  for (; i < lines.length; i++) {
    const f = /^\s*(```|~~~)/.exec(lines[i]);
    if (f) fence = fence ? (lines[i].trim().startsWith(fence) ? "" : fence) : f[1];
    else if (!fence) out.push({ no: i + 1, line: lines[i] });
  }
  return out;
}
