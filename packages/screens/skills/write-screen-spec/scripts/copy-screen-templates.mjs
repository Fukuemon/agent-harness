// 画面仕様書の雛形（このスキルの references/screens/）を、context/project.yml の screens.dir（既定は docs/screens）へ写す。
// リポジトリのルートで流す。既にあるファイルは上書きしない。
// ただし、モックの共通の処理（_common/ の mock.js、interact.js、mock.css、embed-mock.js）は、違えば差分を出し、--update のときだけ上書きする。
// _common/wireframe.css は、利用者がトークンを当てるので、無いときだけ写す。
// 使い方: node copy-screen-templates.mjs [--update]
// 終了コード: 0 は完了、1 は共通の処理に差分があり上書きしていない、2 は設定の誤りか、ファイルが読めない
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { readScreensConfig } from "./read-screens-config.mjs";

const UPDATED = new Set(["_common/mock.js", "_common/interact.js", "_common/mock.css", "_common/embed-mock.js"]);
const root = process.cwd();
const source = fileURLToPath(new URL("../references/screens/", import.meta.url));
const args = process.argv.slice(2);
if (args.some((a) => a !== "--update")) fail(`知らない引数: ${args.filter((a) => a !== "--update").join(" ")}`);
const update = args.includes("--update");

let dir;
try {
  const projectPath = join(root, "context/project.yml");
  dir = (existsSync(projectPath) ? readScreensConfig(readFileSync(projectPath, "utf8")) : {}).dir ?? "docs/screens";
} catch (e) {
  fail(`context/project.yml: ${e.message}`);
}

const copied = [];
const skipped = [];
const updated = [];
let differs = 0;
try {
  for (const file of files(source)) {
    const rel = relative(source, file).split("\\").join("/");
    const dest = join(root, dir, rel);
    if (!existsSync(dest)) {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(file, dest);
      copied.push(rel);
      continue;
    }
    if (!UPDATED.has(rel) || readFileSync(dest, "utf8") === readFileSync(file, "utf8")) {
      skipped.push(rel);
      continue;
    }
    console.log(diff(dest, file));
    if (update) {
      copyFileSync(file, dest);
      updated.push(rel);
    } else differs++;
  }
} catch (e) {
  fail(`読めない: ${e.message}`);
}

const show = (label, list) => list.length && console.log(`${label}:\n${list.map((p) => `  ${join(dir, p)}`).join("\n")}`);
show("写した", copied);
show("更新した", updated);
show("飛ばした（既にあるか、同じ内容）", skipped);
if (differs > 0) {
  console.log(`共通の処理の ${differs} 件に差分がある。上の差分を確認し、取り込むなら --update を付けて流し直す。`);
  process.exit(1);
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
}

// git diff は差分があると終了コード 1 を返す
function diff(current, next) {
  try {
    execFileSync("git", ["diff", "--no-index", "--no-color", "--", current, next], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return "";
  } catch (e) {
    return e.stdout || `${current}: 雛形と内容が違う`;
  }
}
