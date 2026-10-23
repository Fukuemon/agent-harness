// copy-screen-templates.mjs を、使い捨てのリポジトリで実行する。
// 実行: node --test packages/screens/skills/write-screen-spec/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("copy-screen-templates.mjs", import.meta.url));
const templates = fileURLToPath(new URL("../references/screens/", import.meta.url));

function repo(project = "") {
  const dir = mkdtempSync(join(tmpdir(), "copy-screen-templates-"));
  mkdirSync(join(dir, "context"));
  writeFileSync(join(dir, "context/project.yml"), `version: 2\n${project}`);
  return dir;
}

function run(cwd, args = []) {
  try {
    return { code: 0, out: execFileSync("node", [script, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status, out: `${e.stdout}${e.stderr}` };
  }
}

test("screens.dir が無ければ docs/screens へ、あればその場所へ写す", () => {
  const plain = repo();
  assert.equal(run(plain).code, 0);
  for (const p of ["rules.md", "index.md", "_template/index.md", "_common/mock.js", "_common/wireframe.css"]) assert.ok(existsSync(join(plain, "docs/screens", p)), p);
  const custom = repo("screens:\n  dir: docs/ui\n");
  assert.equal(run(custom).code, 0);
  assert.ok(existsSync(join(custom, "docs/ui/rules.md")));
  assert.ok(!existsSync(join(custom, "docs/screens")));
});

test("既にある規約と wireframe.css は上書きしない", () => {
  const dir = repo();
  run(dir);
  writeFileSync(join(dir, "docs/screens/rules.md"), "# 直した規約\n");
  writeFileSync(join(dir, "docs/screens/_common/wireframe.css"), ":root { --wf-ink: red; }\n");
  const r = run(dir, ["--update"]);
  assert.equal(r.code, 0, r.out);
  assert.equal(readFileSync(join(dir, "docs/screens/rules.md"), "utf8"), "# 直した規約\n");
  assert.equal(readFileSync(join(dir, "docs/screens/_common/wireframe.css"), "utf8"), ":root { --wf-ink: red; }\n");
});

test("共通の処理が違えば差分を出して終了コード 1、--update で上書きする", () => {
  const dir = repo();
  run(dir);
  const mockJs = join(dir, "docs/screens/_common/mock.js");
  writeFileSync(mockJs, "// 古い mock.js\n");
  const r = run(dir);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /古い mock.js/);
  assert.equal(readFileSync(mockJs, "utf8"), "// 古い mock.js\n");
  assert.equal(run(dir, ["--update"]).code, 0);
  assert.equal(readFileSync(mockJs, "utf8"), readFileSync(join(templates, "_common/mock.js"), "utf8"));
});

test("知らない引数と、読めない screens の値は、終了コード 2 で終わる", () => {
  assert.equal(run(repo(), ["--force"]).code, 2);
  assert.equal(run(repo("screens:\n  dir: ../screens\n")).code, 2);
});
