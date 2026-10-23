// 組み立てのスクリプト build-docs-site.mjs が docs_site.parts のとおりに並べ、不正な値と欠けた出力を報告すること、
// schemas/docs-site.schema.json がスクリプトと同じ値を通して拒むことを確認する。
// 実行: node --test packages/docs-site/scripts/build-docs-site.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";

const script = fileURLToPath(new URL("../skills/publish-docs-site/assets/scripts/build-docs-site.mjs", import.meta.url));
const schema = JSON.parse(readFileSync(new URL("../schemas/docs-site.schema.json", import.meta.url), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

const example = () => ({
  docs_site: {
    parts: [
      { path: "site", subpath: "" },
      { path: "catalog/dist", subpath: "catalog", build: "make catalog" },
      { path: "erd", subpath: "erd", exclude: ["serve.json"] },
    ],
    tokens_css: "docs/stylesheets/tokens.css",
  },
});

function repo(project, files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "docs-site-"));
  mkdirSync(join(dir, "context"));
  writeFileSync(join(dir, "context/project.yml"), stringify({ version: 2, ...project }));
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), body);
  }
  return dir;
}

const run = (dir, ...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: "utf8" });

const outputs = {
  "site/index.html": "docs",
  "catalog/dist/index.html": "catalog",
  "erd/index.html": "erd",
  "erd/serve.json": "{}",
};

test("parts のとおりにサブパスへ並べ、exclude のファイルを写さず、前の出力を消す", () => {
  const dir = repo(example(), { ...outputs, "public/stale.html": "old" });
  const r = run(dir, "--out", "public");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(dir, "public/index.html"), "utf8"), "docs");
  assert.equal(readFileSync(join(dir, "public/catalog/index.html"), "utf8"), "catalog");
  assert.equal(readFileSync(join(dir, "public/erd/index.html"), "utf8"), "erd");
  assert.equal(existsSync(join(dir, "public/erd/serve.json")), false);
  assert.equal(existsSync(join(dir, "public/stale.html")), false);
});

test("並べるものがなければ、build のコマンドを案内して終了コード 1", () => {
  const { "catalog/dist/index.html": _, ...rest } = outputs;
  const r = run(repo(example(), rest), "--out", "public");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /catalog\/dist がない。先に make catalog を実行する/);
});

test("--build は並べる前に build のコマンドを実行し、失敗したら終了コード 2", () => {
  const project = { docs_site: { parts: [{ path: "out", subpath: "", build: "mkdir out && echo built > out/index.html" }] } };
  const dir = repo(project);
  const r = run(dir, "--out", "public", "--build");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(dir, "public/index.html"), "utf8").trim(), "built");

  project.docs_site.parts[0].build = "exit 3";
  assert.equal(run(repo(project), "--out", "public", "--build").status, 2);
});

test("--out がないか、並べるものと重なれば終了コード 1", () => {
  const dir = repo(example(), outputs);
  assert.equal(run(dir).status, 1);
  assert.equal(run(dir, "--out", "../public").status, 1);
  assert.equal(run(dir, "--out", "site").status, 1);
  assert.equal(run(dir, "--out", "catalog").status, 1);
  assert.equal(existsSync(join(dir, "site/index.html")), true);
});

test("値のファイルが読めなければ終了コード 2", () => {
  const dir = repo(example());
  assert.equal(run(dir, "--out", "public", "--project", "missing.yml").status, 2);
});

test("schema とスクリプトは、同じ値を通して同じ値を拒む", () => {
  const cases = [
    ["例", (d) => d, true],
    ["tokens_css を省く", (d) => delete d.docs_site.tokens_css, true],
    ["parts が空", (d) => (d.docs_site.parts = []), false],
    ["parts がない", (d) => delete d.docs_site.parts, false],
    ["subpath を省く", (d) => delete d.docs_site.parts[1].subpath, false],
    ["path が親を指す", (d) => (d.docs_site.parts[1].path = "../dist"), false],
    ["path の先頭に /", (d) => (d.docs_site.parts[1].path = "/dist"), false],
    ["subpath の末尾に /", (d) => (d.docs_site.parts[1].subpath = "catalog/"), false],
    ["知らないキー", (d) => (d.docs_site.parts[1].target = "x"), false],
    ["exclude にパス", (d) => (d.docs_site.parts[2].exclude = ["a/b"]), false],
    ["build が空", (d) => (d.docs_site.parts[1].build = ""), false],
  ];
  for (const [name, edit, ok] of cases) {
    const doc = example();
    edit(doc);
    assert.equal(validate({ version: 2, ...doc }), ok, `schema: ${name}`);
    const r = run(repo(doc, outputs), "--out", "public");
    assert.equal(r.status, ok ? 0 : 1, `スクリプト: ${name}\n${r.stderr}`);
  }
});

test("subpath の重なりはスクリプトが拒む", () => {
  const doc = example();
  doc.docs_site.parts[2].subpath = "catalog";
  const r = run(repo(doc, outputs), "--out", "public");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ほかの part と重なる/);
});
