// read-screens-config.mjs の readScreensConfig を、値のファイルの本文に対して呼ぶ。
// 実行: node --test packages/screens/skills/write-screen-spec/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readScreensConfig } from "./read-screens-config.mjs";

test("screens の下の 1 段の値を、引用符と行末のコメントを外して読む", () => {
  const text = "version: 2\nscreens:\n  # 画面仕様書\n  dir: docs/ui # 置き場\n  catalog_url: \"https://example.com/#/c\" # カタログ\n  e2e_dir: 'e2e'\ndocs:\n  design: design\n";
  assert.deepEqual(readScreensConfig(text), { dir: "docs/ui", catalog_url: "https://example.com/#/c", e2e_dir: "e2e" });
});

test("screens が無ければ、空のオブジェクトを返す", () => {
  assert.deepEqual(readScreensConfig("version: 2\n"), {});
});

test("読めない形と、形の誤った値は、Error を投げる", () => {
  for (const text of [
    "screens: {dir: docs}\n",
    "screens:\n  dir: |\n    docs\n",
    "screens:\n  dir: \"docs\n",
    "screens:\n  dir: /docs\n",
    "screens:\n  catalog_url: catalog\n",
  ]) assert.throws(() => readScreensConfig(text), Error, text);
});
