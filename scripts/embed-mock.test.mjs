// screens と docs-site が別々に配る embed-mock.js の、コメントを除いたコードが同じことを確認する。
// 2 つのパッケージは互いに依存しないので、モックの高さを受けるスクリプトを両方に置いている。
// 実行: node --test scripts/embed-mock.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const copies = [
  "../packages/screens/skills/write-screen-spec/references/screens/_common/embed-mock.js",
  "../packages/docs-site/skills/publish-docs-site/references/zensical/docs/javascripts/embed-mock.js",
];

const code = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .join("\n");

test("2 つの embed-mock.js は、コメントを除いて同じ", () => {
  assert.equal(code(copies[1]), code(copies[0]));
});
