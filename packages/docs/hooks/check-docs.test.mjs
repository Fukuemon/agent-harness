// check-docs.mjs が、Claude Code と Codex CLI の入力から編集した Markdown を取り、報告があるときだけ促す文を返すことを確かめる。
// 実行: node --test packages/docs/hooks/check-docs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const hook = new URL("check-docs.mjs", import.meta.url).pathname;
const run = (cwd, input) => execFileSync("node", [hook], { cwd, input: JSON.stringify(input), encoding: "utf8" });

function dir() {
  const d = mkdtempSync(join(tmpdir(), "check-docs-"));
  writeFileSync(join(d, "DesignDoc.md"), "---\ntype: design-doc\ntitle: t\ndescription: d\n---\n\n# t\n\n## 変更履歴\n\n[切れ](gone.md)\n");
  writeFileSync(join(d, "ok.md"), "# ok\n\n[自分](#ok)\n");
  return d;
}

test("Claude Code の Write の後に、変更履歴の見出しとリンク切れを促す", () => {
  const d = dir();
  const out = JSON.parse(run(d, { tool_name: "Write", tool_input: { file_path: join(d, "DesignDoc.md"), content: "" } }));
  const text = out.hookSpecificOutput.additionalContext;
  assert.match(text, /変更履歴の見出しがある/);
  assert.match(text, /- 9 行: ## 変更履歴/);
  assert.match(text, /- 11 行: gone\.md（ファイルがない）/);
});

test("Codex CLI の apply_patch の後に、パッチにある Markdown を見る", () => {
  const d = dir();
  const patch = "*** Begin Patch\n*** Update File: DesignDoc.md\n@@\n+## 変更履歴\n*** Add File: ok.md\n+# ok\n*** End Patch";
  const out = JSON.parse(run(d, { tool_name: "apply_patch", tool_input: { command: patch } }));
  assert.match(out.hookSpecificOutput.additionalContext, /DesignDoc\.md に変更履歴の見出しがある/);
  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /ok\.md/);
});

test("報告がないときと、Markdown でないときは何も返さない", () => {
  const d = dir();
  assert.equal(run(d, { tool_name: "Edit", tool_input: { file_path: join(d, "ok.md") } }), "");
  assert.equal(run(d, { tool_name: "Edit", tool_input: { file_path: join(d, "a.js") } }), "");
  assert.equal(execFileSync("node", [hook], { cwd: d, input: "not json", encoding: "utf8" }), "");
});
