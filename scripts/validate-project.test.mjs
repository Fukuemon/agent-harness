// 値のファイルの schema が、例を通し、必須と条件つきの制約を検出することを確かめる。
// 実行: node --test scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(readFileSync(new URL("../schemas/project.schema.json", import.meta.url), "utf8"));
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
const example = () => parse(readFileSync(new URL("../examples/project.yml", import.meta.url), "utf8"));

test("examples/project.yml は schema に合う", () => {
  assert.equal(validate(example()), true, JSON.stringify(validate.errors));
});

test("version がないと合わない", () => {
  const doc = example();
  delete doc.version;
  assert.equal(validate(doc), false);
});

test("direct_commit.allow が true なら reason が要る", () => {
  const doc = example();
  doc.guardrails.protected_branches.direct_commit = { allow: true, reason: "" };
  assert.equal(validate(doc), false);
  doc.guardrails.protected_branches.direct_commit = { allow: true, reason: "立ち上げの時期" };
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
});

test("知らないキーは拒否しない", () => {
  const doc = example();
  doc.my_own_key = { anything: 1 };
  assert.equal(validate(doc), true);
});

test("プロセスの識別子は英字の slug", () => {
  const doc = example();
  doc.process.defaults.reflect_at = "設計";
  assert.equal(validate(doc), false);
});
