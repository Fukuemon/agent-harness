// 値のファイルを packages/core/schemas/project.schema.json で検証する。
// 使い方: node packages/core/scripts/validate-project.mjs [path/to/project.yml]
// 終了コード: 0 は問題なし、1 は schema に合わない、2 はファイルが読めない
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";

const target = resolve(process.argv[2] ?? "context/project.yml");
const schemaPath = new URL("../schemas/project.schema.json", import.meta.url);

let doc;
try {
  doc = parse(readFileSync(target, "utf8"));
} catch (err) {
  console.error(`読めない: ${target}\n${err.message}`);
  process.exit(2);
}

const ajv = new Ajv2020({ allErrors: true });
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
