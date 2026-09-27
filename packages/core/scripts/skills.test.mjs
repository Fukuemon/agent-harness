// core のスキルの SKILL.md の frontmatter が YAML として読め、name と description を持つことを確かめる。
// 実行: node --test packages/core/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const skillsDir = fileURLToPath(new URL("../skills/", import.meta.url));

for (const name of readdirSync(skillsDir)) {
  test(`スキル ${name} の frontmatter は YAML として読める`, () => {
    const body = readFileSync(join(skillsDir, name, "SKILL.md"), "utf8");
    const block = /^---\n([\s\S]*?)\n---/.exec(body)?.[1];
    assert.ok(block, "frontmatter がない");
    const meta = parse(block);
    assert.equal(meta.name, name);
    assert.ok(meta.description, "description がない");
  });
}
