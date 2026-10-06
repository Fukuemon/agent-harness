// Markdown の編集の後に、経緯の混入とリンク切れがあれば、確かめるよう促す文をコンテキストに追加する。編集は拒否しない。
// 使い方: PostToolUse のフックから呼ぶ。標準入力に tool_name と tool_input の JSON を受け取る。context/project.yml がないリポジトリでは何もしない
// 終了コード: 常に 0。報告があれば、hookSpecificOutput.additionalContext を標準出力に書く
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { brokenLinks, historyFindings, isHistoryTarget } from "./doc-checks.mjs";

if (!installed()) process.exit(0);

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const text = [];
for (const file of editedFiles(input).filter((f) => f.endsWith(".md") && existsSync(resolve(f)))) {
  const body = readFileSync(resolve(file), "utf8");
  const history = isHistoryTarget(body) ? historyFindings(body) : [];
  const headings = history.filter((h) => h.kind === "heading");
  const issues = history.filter((h) => h.kind === "issue");
  if (headings.length) text.push(`${file} に変更履歴の見出しがある。Design Doc と context は現在の状態だけを書く。経緯は ADR とコミットに移す。`, ...headings.map((h) => `- ${h.line} 行: ${h.text}`));
  if (issues.length) text.push(`${file} に issue の番号がある。未解決の論点を指す番号だけを残し、解決したものは記述ごと消す。`, ...issues.map((h) => `- ${h.line} 行: ${h.text}`));
  const links = brokenLinks(resolve(file), body);
  if (links.length) text.push(`${file} にリンク切れがある。`, ...links.map((l) => `- ${l.line} 行: ${l.target}（${l.reason}）`));
}
if (text.length) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text.join("\n") } }));
process.exit(0);

// Claude Code は tool_input.file_path に、Codex CLI は apply_patch のパッチの本文にパスを持つ
function editedFiles({ tool_input: t = {} } = {}) {
  if (typeof t.command === "string" && t.command.includes("*** Begin Patch")) {
    return [...t.command.matchAll(/^\*\*\* (?:Add|Update) File: (.+)$/gm)].map((m) => m[1].trim());
  }
  return typeof t.file_path === "string" ? [t.file_path] : [];
}

// agent-harness を導入したリポジトリか。コーディングエージェントによっては、プラグインを入れたすべてのリポジトリでフックを動かす
function installed(dir = process.env.CLAUDE_PROJECT_DIR || process.cwd()) {
  for (let d = resolve(dir); ; d = dirname(d)) {
    if (existsSync(join(d, "context", "project.yml"))) return true;
    if (d === dirname(d)) return false;
  }
}
