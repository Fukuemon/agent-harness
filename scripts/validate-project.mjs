#!/usr/bin/env node
// 値のファイルを schemas/project.schema.json で検証する。
// 使い方: node scripts/validate-project.mjs [path/to/project.yml]
// 終了コード: 0 は問題なし、1 は schema に合わない、2 はファイルが読めない
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(process.argv[2] ?? "context/project.yml");
const schemaPath = resolve(here, "../schemas/project.schema.json");

let doc;
try {
  doc = parse(readFileSync(target, "utf8"));
} catch (err) {
  console.error(`読めない: ${target}\n${err.message}`);
  process.exit(2);
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, "utf8")));

if (validate(doc)) {
  console.log(`OK: ${target}`);
  process.exit(0);
}
console.error(`schema に合わない: ${target}`);
for (const e of validate.errors) {
  console.error(`  ${e.instancePath || "/"}: ${e.message}`);
}
process.exit(1);
