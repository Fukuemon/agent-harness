// check-comments.mjs が、Edit、Write、MultiEdit、apply_patch の入力から足されたコメントを見つけ、ないときは何も返さないことを確かめる。
// 実行: node --test packages/core/hooks/check-comments.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./check-comments.mjs", import.meta.url));

function run(input) {
  const r = spawnSync("node", [script], { input: typeof input === "string" ? input : JSON.stringify(input), encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : "";
}

test("Edit で足したコメントだけを挙げ、元からある行は挙げない", () => {
  const out = run({ tool_name: "Edit", tool_input: { file_path: "src/a.mjs", old_string: "// 元から\nconst a = 1;", new_string: "// 元から\nconst a = 1; // 足した\nconst b = 2;" } });
  assert.match(out, /^実装のコメントを足した/);
  assert.match(out, /- src\/a\.mjs: const a = 1; \/\/ 足した/);
  assert.doesNotMatch(out, /元から/);
});

test("文書コメントの記法は、契約を確かめる文で挙げる", () => {
  const out = run({ tool_name: "Write", tool_input: { file_path: "lib.ts", content: "/**\n * 合計を返す。\n */\nexport const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);\n" } });
  assert.match(out, /^文書コメントを足した/);
  assert.match(out, /- lib\.ts: \* 合計を返す。/);
  assert.doesNotMatch(out, /実装のコメント/);
});

test("Write の Python では # のコメントを挙げ、shebang は挙げない", () => {
  const out = run({ tool_name: "Write", tool_input: { file_path: "tool.py", content: "#!/usr/bin/env python3\n# noqa\nprint(1)\n" } });
  assert.match(out, /- tool\.py: # noqa/);
  assert.doesNotMatch(out, /usr\/bin/);
  assert.match(out, /抑制がある/);
});

test("MultiEdit は edits のそれぞれを見る", () => {
  const out = run({ tool_name: "MultiEdit", tool_input: { file_path: "a.ts", edits: [{ old_string: "x", new_string: "x" }, { old_string: "y", new_string: "y // @ts-ignore" }] } });
  assert.match(out, /@ts-ignore/);
});

test("apply_patch のパッチからファイル名と足された行を取る", () => {
  const patch = "*** Begin Patch\n*** Update File: lib/b.go\n@@\n-old\n+// TODO\n+x := 1\n*** Add File: c.sql\n+-- 注記\n*** End Patch";
  const out = run({ tool_name: "apply_patch", tool_input: { command: patch } });
  assert.match(out, /- lib\/b\.go: \/\/ TODO/);
  assert.match(out, /- c\.sql: -- 注記/);
  assert.doesNotMatch(out, /x := 1/);
});

test("コメントがない編集、Markdown、JSON、壊れた入力では何も返さない", () => {
  assert.equal(run({ tool_name: "Edit", tool_input: { file_path: "a.mjs", old_string: "a", new_string: "const b = 2;" } }), "");
  assert.equal(run({ tool_name: "Write", tool_input: { file_path: "README.md", content: "<!-- 案内 -->" } }), "");
  assert.equal(run({ tool_name: "Write", tool_input: { file_path: "a.json", content: "// x" } }), "");
  assert.equal(run("not json"), "");
});

test("Python の docstring は文書コメントとして挙げる", () => {
  const out = run({ tool_name: "Write", tool_input: { file_path: "api.py", content: 'def get(x):\n    """Return the item."""\n    return x\n' } });
  assert.match(out, /^文書コメントを足した/);
  assert.match(out, /- api\.py: """Return the item\."""/);
});

test("元からある行と同じコメントを 2 つ目に足しても挙げる", () => {
  const out = run({ tool_name: "Edit", tool_input: { file_path: "a.mjs", old_string: "// TODO\nconst a = 1;", new_string: "// TODO\nconst a = 1;\n// TODO\nconst b = 2;" } });
  assert.match(out, /- a\.mjs: \/\/ TODO/);
  assert.equal((out.match(/\/\/ TODO/g) || []).length, 1);
});
