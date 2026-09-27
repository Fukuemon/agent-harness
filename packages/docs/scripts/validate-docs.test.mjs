// docs の schema が、core のテンプレートを通し、docs のキーの欠けと不正なパスを検出することを確かめる。
// 実行: node --test packages/docs/scripts/validate-docs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(readFileSync(new URL("../schemas/docs.schema.json", import.meta.url), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const example = () => parse(readFileSync(new URL("../../core/skills/setup-agent-harness/assets/context/project.yml", import.meta.url), "utf8"));

test("core のテンプレートの project.yml は docs の schema に合う", () => {
  assert.equal(validate(example()), true, JSON.stringify(validate.errors));
});

test("docs のキーが欠けると合わない", () => {
  const doc = example();
  delete doc.docs.spec;
  assert.equal(validate(doc), false);
});

test("先頭か末尾に / のあるパスは合わない", () => {
  const doc = example();
  doc.docs.design = "/design";
  assert.equal(validate(doc), false);
  doc.docs.design = "docs/design";
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test("空、.、.. の区切りを含むパスは合わない", () => {
  const doc = example();
  for (const bad of ["..", ".", "../shared", "docs/../x", "docs/.", "docs//x"]) {
    doc.docs.design = bad;
    assert.equal(validate(doc), false, bad);
  }
  doc.docs.design = ".docs/design..v2";
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test("ほかのパッケージのキーがなくても合う", () => {
  const doc = example();
  delete doc.guardrails;
  delete doc.process;
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});
