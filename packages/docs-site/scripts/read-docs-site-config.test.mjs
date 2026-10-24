// read-docs-site-config.mjs が、受ける形の YAML を yaml のライブラリと同じ値に読み、ほかの形を FormError で拒むこと、
// validateDocsSite が schemas/docs-site.schema.json と同じ値を通して拒むことを確認する。
// 実行: node --test packages/docs-site/scripts/read-docs-site-config.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import { FormError, readDocsSiteConfig, validateDocsSite } from "../skills/publish-docs-site/assets/scripts/read-docs-site-config.mjs";

const schema = JSON.parse(readFileSync(new URL("../schemas/docs-site.schema.json", import.meta.url), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

const EXAMPLE = `version: 2
# 文書のサイト
docs_site:
  parts:
    - path: site
      subpath: ""
      build: "uv run zensical build --clean" # 文書
    - path: catalog/dist
      subpath: catalog
      build: 'make catalog, then echo "ok: done" # not a comment'
    -   path: erd
        subpath: erd
        exclude: [serve.json, .keep]
  tokens_css: docs/stylesheets/tokens.css
docs:
  design: design
`;

test("受ける形を、yaml のライブラリと同じ値に読む", () => {
  assert.deepEqual(readDocsSiteConfig(EXAMPLE), parse(EXAMPLE).docs_site);
});

test("build の , # : は、引用符で囲めば値のまま読む", () => {
  const text = `docs_site:\n  parts:\n    - path: site\n      subpath: ""\n      build: "a, b # c: d"\n`;
  assert.equal(readDocsSiteConfig(text).parts[0].build, "a, b # c: d");
  assert.deepEqual(readDocsSiteConfig(text), parse(text).docs_site);
});

test("- をキーと同じ字下げに置く配列と、空の exclude を読む", () => {
  const text = `docs_site:\n  parts:\n  - path: site\n    subpath: ""\n    exclude: []\n`;
  assert.deepEqual(readDocsSiteConfig(text), parse(text).docs_site);
});

test("docs_site が無ければ undefined", () => {
  assert.equal(readDocsSiteConfig("version: 2\ndocs:\n  design: design\n"), undefined);
});

test("受けない形は FormError", () => {
  const forms = {
    フローのマッピング: "docs_site: {parts: []}\n",
    フローの配列の_parts: "docs_site:\n  parts: []\n",
    ブロックの配列の_exclude: "docs_site:\n  parts:\n    - path: erd\n      subpath: erd\n      exclude:\n        - serve.json\n",
    引用符の_exclude: "docs_site:\n  parts:\n    - path: erd\n      subpath: erd\n      exclude: [\"serve.json\"]\n",
    ブロックのスカラー: "docs_site:\n  parts:\n    - path: site\n      subpath: \"\"\n      build: |\n        make\n",
    閉じていない引用符: "docs_site:\n  parts:\n    - path: \"site\n      subpath: \"\"\n",
    引用符のない_コロン: "docs_site:\n  parts:\n    - path: site\n      subpath: \"\"\n      build: echo a: b\n",
    バックスラッシュ: "docs_site:\n  parts:\n    - path: site\n      subpath: \"\"\n      build: \"echo \\\"a\\\"\"\n",
    字下げのずれ: "docs_site:\n  parts:\n    - path: site\n       subpath: \"\"\n",
    タブ: "docs_site:\n\tparts:\n",
    空の値: "docs_site:\n  parts:\n    - path: site\n      subpath:\n",
    キーの重なり: "docs_site:\n  parts:\n    - path: site\n      path: x\n      subpath: \"\"\n",
  };
  for (const [name, text] of Object.entries(forms)) assert.throws(() => readDocsSiteConfig(text), FormError, name);
});

const example = () => readDocsSiteConfig(EXAMPLE);

test("validateDocsSite と schema は、同じ値を通して同じ値を拒む", () => {
  const cases = [
    ["例", () => {}, true],
    ["tokens_css を省く", (d) => delete d.tokens_css, true],
    ["parts が空", (d) => (d.parts = []), false],
    ["parts がない", (d) => delete d.parts, false],
    ["subpath を省く", (d) => delete d.parts[1].subpath, false],
    ["path が親を指す", (d) => (d.parts[1].path = "../dist"), false],
    ["path の先頭に /", (d) => (d.parts[1].path = "/dist"), false],
    ["subpath の末尾に /", (d) => (d.parts[1].subpath = "catalog/"), false],
    ["part の知らないキー", (d) => (d.parts[1].target = "x"), false],
    ["docs_site の知らないキー", (d) => (d.out = "x"), false],
    ["exclude にパス", (d) => (d.parts[2].exclude = ["a/b"]), false],
    ["build が空", (d) => (d.parts[1].build = ""), false],
    ["tokens_css が親を指す", (d) => (d.tokens_css = "../t.css"), false],
  ];
  for (const [name, edit, ok] of cases) {
    const d = example();
    edit(d);
    assert.equal(validate({ docs_site: d }), ok, `schema: ${name}`);
    assert.equal(validateDocsSite(d).length === 0, ok, `validateDocsSite: ${name}`);
  }
});

test("ルート以外の subpath の重なりと入れ子、2 つのルートは validateDocsSite が拒む", () => {
  for (const [a, b] of [["catalog", "catalog"], ["catalog", "catalog/x"], ["catalog/x", "catalog"], ["", ""]]) {
    const d = example();
    d.parts[1].subpath = a;
    d.parts[2].subpath = b;
    assert.match(validateDocsSite(d).join("\n"), /重なる|1 つだけ/, `${a} と ${b}`);
  }
  const d = example();
  d.parts[1].subpath = "catalog";
  d.parts[2].subpath = "catalogue";
  assert.deepEqual(validateDocsSite(d), []);
});
