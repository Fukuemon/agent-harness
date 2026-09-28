// write-commit が配る commitlint の設定のテンプレートが、このリポジトリの設定と同じであることを確かめる。
// 実行: node --test scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("commitlint の設定のテンプレートは、このリポジトリの設定と同じ", () => {
  assert.equal(read("packages/core/skills/write-commit/assets/commitlint.config.mjs"), read("commitlint.config.mjs"));
});
