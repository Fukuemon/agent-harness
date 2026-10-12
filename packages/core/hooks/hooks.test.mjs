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

// apm の代わりに、呼ばれた回数を数えるだけのコマンドを PATH に置く
function fakeApm() {
  const bin = mkdtempSync(join(tmpdir(), "fake-apm-"));
  writeFileSync(join(bin, "apm"), `#!/bin/sh\necho x >> "${join(bin, "calls")}"\n`, { mode: 0o755 });
  return { bin, calls: () => (existsSync(join(bin, "calls")) ? readFileSync(join(bin, "calls"), "utf8").split("\n").filter(Boolean).length : 0) };
}

test("apm.lock.yaml が前回の配置から変わったときだけ、apm install --frozen をやり直す", () => {
  const repo = mkdtempSync(join(tmpdir(), "session-start-"));
  spawnSync("git", ["init", "-q"], { cwd: repo });
  mkdirSync(join(repo, "context"));
  writeFileSync(join(repo, "context", "project.yml"), "");
  writeFileSync(join(repo, "apm.lock.yaml"), "dependencies: []\n");
  const apm = fakeApm();
  const start = () => {
    const r = spawnSync("sh", ["-c", command], { env: { ...process.env, PATH: `${apm.bin}:${process.env.PATH}`, CLAUDE_PROJECT_DIR: repo, CLAUDE_PLUGIN_ROOT: pluginRoot }, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
  };
  start();
  assert.equal(apm.calls(), 1, "記録がない最初のセッションで配置する");
  start();
  assert.equal(apm.calls(), 1, "lock が変わらなければ配置し直さない");
  writeFileSync(join(repo, "apm.lock.yaml"), "dependencies:\n- repo_url: example\n");
  start();
  assert.equal(apm.calls(), 2, "lock が変われば配置し直す");
});

test("ファイルの編集の後のフックは、導入したリポジトリでチェックが見つからなければ、飛ばしたことを表示する", () => {
  const post = JSON.parse(readFileSync(new URL("hooks.json", import.meta.url), "utf8")).hooks.PostToolUse[0].hooks[0].command;
  const repo = mkdtempSync(join(tmpdir(), "post-tool-"));
  spawnSync("git", ["init", "-q"], { cwd: repo });
  const run = () => spawnSync("sh", ["-c", post], { cwd: repo, env: { ...process.env, CLAUDE_PLUGIN_ROOT: "" }, encoding: "utf8", input: "{}" });
  assert.equal(run().stderr, "", "導入していないリポジトリでは何も表示しない");
  mkdirSync(join(repo, "context"));
  writeFileSync(join(repo, "context", "project.yml"), "");
  const r = run();
  assert.equal(r.status, 0);
  assert.match(r.stderr, /check-comments\.mjs がないので/);
});
