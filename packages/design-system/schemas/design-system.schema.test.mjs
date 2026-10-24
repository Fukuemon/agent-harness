// design-system.schema.json が、design_system のキーの相対パスと URL を受け、絶対パスと URL でない値を拒むことを確かめる。
// 実行: node --test "packages/design-system/**/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const schema = JSON.parse(readFileSync(new URL("./design-system.schema.json", import.meta.url), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

test("相対パスの tokens_css と、http の catalog_url を受ける", () => {
  assert.ok(validate({ version: 2, design_system: { tokens_css: "docs/screens/_common/tokens.css", catalog_url: "https://catalog.example.com/" } }), JSON.stringify(validate.errors));
  assert.ok(validate({ version: 2 }));
});

test("絶対パスと .. を含む tokens_css、URL でない catalog_url を拒む", () => {
  assert.ok(!validate({ version: 2, design_system: { tokens_css: "/docs/tokens.css" } }));
  assert.ok(!validate({ version: 2, design_system: { tokens_css: "../tokens.css" } }));
  assert.ok(!validate({ version: 2, design_system: { catalog_url: "catalog" } }));
});
