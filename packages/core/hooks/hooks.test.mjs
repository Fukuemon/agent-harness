// hooks.json のセッションの開始のフックが、context/project.yml があるリポジトリでだけ .gitignore をそろえることを確かめる。
// 実行: node --test packages/core/hooks/hooks.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const pluginRoot = fileURLToPath(new URL("..", import.meta.url));
const command = JSON.parse(readFileSync(new URL("hooks.json", import.meta.url), "utf8")).hooks.SessionStart[0].hooks[0].command;

function run(withProject) {
  const repo = mkdtempSync(join(tmpdir(), "session-start-"));
  writeFileSync(join(repo, "apm.lock.yaml"), "dependencies: []\n");
  if (withProject) {
    mkdirSync(join(repo, "context"));
    writeFileSync(join(repo, "context", "project.yml"), "");
  }
  const r = spawnSync("sh", ["-c", command], { env: { ...process.env, CLAUDE_PROJECT_DIR: repo, CLAUDE_PLUGIN_ROOT: pluginRoot }, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return repo;
}

test("context/project.yml がないリポジトリでは、apm.lock.yaml があっても .gitignore を変えない", () => {
  assert.equal(existsSync(join(run(false), ".gitignore")), false);
});

test("context/project.yml があるリポジトリでは、.gitignore に .ai-out/ を足す", () => {
  assert.match(readFileSync(join(run(true), ".gitignore"), "utf8"), /^\.ai-out\/$/m);
});
