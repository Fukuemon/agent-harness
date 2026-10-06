// ファイルの編集の後に、追加された行にコメントか lint の抑制があれば、確かめるよう促す文をコンテキストに追加する。編集は拒否しない。
// 文書コメント（/**、///、//!、"""）と実装のコメントで、促す文を分ける
// 使い方: PostToolUse のフックから呼ぶ。標準入力に tool_name と tool_input の JSON を受け取る。context/project.yml がないリポジトリでは何もしない
// 終了コード: 常に 0。コメントが足されていれば、hookSpecificOutput.additionalContext を標準出力に書く
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

const SLASH = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".go", ".rs", ".java", ".kt", ".swift", ".c", ".h", ".cpp", ".cs", ".php", ".css", ".scss", ".dart"]);
const HASH = new Set([".py", ".sh", ".bash", ".zsh", ".rb", ".yml", ".yaml", ".toml", ".pl", ".r", ".mk"]);
const DASH = new Set([".sql", ".lua", ".hs"]);
const ANGLE = new Set([".html", ".vue", ".svelte", ".xml"]);
const SUPPRESS = /eslint-disable|@ts-ignore|@ts-expect-error|biome-ignore|noqa|nolint|prettier-ignore|textlint-disable|type: ?ignore|pylint: ?disable/;
const DOC = /^(\/\*\*|\/\/\/|\/\/!|"""|'''|\*\s|\*\/)/;

if (!installed()) process.exit(0);

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const hits = addedLines(input).filter(({ file, line }) => isComment(file, line));
if (hits.length) {
  const doc = hits.filter((h) => DOC.test(h.line.trim()));
  const impl = hits.filter((h) => !DOC.test(h.line.trim()));
  const text = [];
  if (doc.length) text.push("文書コメントを足した。スキル write-comments に従い、要約の 1 文と契約があり、名前と型の言い換えになっていないかを確かめる。", ...doc.map((h) => `- ${h.file}: ${h.line.trim()}`));
  if (impl.length) text.push("実装のコメントを足した。スキル write-comments の「残してよい実装のコメント」の 3 つに当たるかを確かめ、当たらなければ消す。", ...impl.map((h) => `- ${h.file}: ${h.line.trim()}`));
  if (hits.some((h) => SUPPRESS.test(h.line))) text.push("lint か型のチェックの抑制がある。抑制の前に、指摘の原因を直す。");
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text.join("\n") } }));
}
process.exit(0);

// 追加された行を、コーディングエージェントごとの入力の形から取り出す
function addedLines({ tool_input: t = {} } = {}) {
  if (typeof t.command === "string" && t.command.includes("*** Begin Patch")) return fromPatch(t.command);
  if (typeof t.file_path !== "string") return [];
  const file = t.file_path;
  if (typeof t.content === "string") return t.content.split("\n").map((line) => ({ file, line }));
  const edits = Array.isArray(t.edits) ? t.edits : [t];
  return edits.flatMap((e) => {
    const remaining = new Map();
    for (const line of (e.old_string ?? "").split("\n")) remaining.set(line, (remaining.get(line) ?? 0) + 1);
    return (e.new_string ?? "").split("\n").filter((line) => {
      const n = remaining.get(line);
      if (!n) return true;
      remaining.set(line, n - 1);
      return false;
    }).map((line) => ({ file, line }));
  });
}

function fromPatch(patch) {
  const out = [];
  let file = "";
  for (const line of patch.split("\n")) {
    const header = /^\*\*\* (?:Add|Update) File: (.+)$/.exec(line);
    if (header) file = header[1].trim();
    else if (line.startsWith("*** ")) file = "";
    else if (file && line.startsWith("+")) out.push({ file, line: line.slice(1) });
  }
  return out;
}

function isComment(file, line) {
  const ext = extname(file).toLowerCase();
  const s = line.trim();
  if (!s) return false;
  if (SLASH.has(ext)) return /^(\/\/|\/\*|\*\s|\*\/)/.test(s) || /\s\/\/\s/.test(line);
  if (ext === ".py" && /^("""|''')/.test(s)) return true;
  if (HASH.has(ext) || basename(file) === "Dockerfile") return (s.startsWith("#") && !s.startsWith("#!")) || /\s#\s/.test(line);
  if (DASH.has(ext)) return s.startsWith("--");
  if (ANGLE.has(ext)) return s.startsWith("<!--");
  return false;
}

// agent-harness を導入したリポジトリか。コーディングエージェントによっては、プラグインを入れたすべてのリポジトリでフックを動かす
function installed(dir = process.env.CLAUDE_PROJECT_DIR || process.cwd()) {
  for (let d = resolve(dir); ; d = dirname(d)) {
    if (existsSync(join(d, "context", "project.yml"))) return true;
    if (d === dirname(d)) return false;
  }
}
