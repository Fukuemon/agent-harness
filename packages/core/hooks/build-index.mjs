// context/ と Design Doc の frontmatter から context/index.md を生成する。編集後のフック、lefthook、CI から呼ぶ。
// 使い方: node build-index.mjs [--write]
// 既定は生成し直した目次と context/index.md を比べ、差分を表示する。--write は context/index.md を書き換える
// 終了コード: 0 は差分なし（--write では書き換え済み）、1 は差分あり、2 は context/ がないか frontmatter に必須のキーがない
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const write = process.argv.includes("--write");
const root = process.cwd();
if (!existsSync(join(root, "context"))) fail("context/ がない。導入のスキル setup-agent-harness で置く");

const project = existsSync(join(root, "context/project.yml")) ? readFileSync(join(root, "context/project.yml"), "utf8") : "";
const designDir = /^\s*design: (.+)$/m.exec(project)?.[1].trim().replace(/^["']|["']$/g, "");
const design = designDir && existsSync(join(root, designDir)) ? collect(join(root, designDir)) : new Map();
const { index, missing } = renderIndex(collect(join(root, "context")), design, designDir);
if (missing.length) fail(missing.join("\n"));

const target = join(root, "context/index.md");
const current = existsSync(target) ? readFileSync(target, "utf8") : "";
if (current === index) process.exit(0);
if (write) {
  writeFileSync(target, index);
  console.log("書き換えた: context/index.md");
  process.exit(0);
}
console.log(current ? showDiff(target, index) : "context/index.md がない");
console.log("context/index.md が frontmatter と合わない。--write を付けて実行すると書き換える");
process.exit(1);

function collect(dir, into = new Map(), base = dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) collect(full, into, base);
    else if (e.name.endsWith(".md")) into.set(relative(base, full).split(sep).join("/"), readFileSync(full, "utf8"));
  }
  return into;
}

function frontmatter(body) {
  const block = /^---\n([\s\S]*?)\n---/.exec(body)?.[1] ?? "";
  const pick = (key) => new RegExp(`^${key}: (.+)$`, "m").exec(block)?.[1].trim();
  return {
    title: pick("title"),
    description: pick("description"),
    status: pick("status"),
    missing: ["type", "title", "description"].filter((key) => !pick(key)),
  };
}

function renderIndex(context, design, designDir) {
  const missing = [];
  const line = (link, body) => {
    const meta = frontmatter(body);
    missing.push(...meta.missing.map((key) => `${link}: frontmatter に ${key} がない`));
    return `- [${meta.title}](${link}) — ${meta.description}${meta.status === "draft" ? "（draft）" : ""}`;
  };
  const sorted = (entries) => [...entries].sort(([a], [b]) => (a < b ? -1 : 1));
  const lines = sorted(context).filter(([f]) => f !== "index.md").map(([f, body]) => line(f, body));
  if (design.size) lines.push("", "## Design Doc", "", ...sorted(design).map(([f, body]) => line(`../${designDir}/${f}`, body)));
  const index = `# context の目次\n\n作業の中で参照する、このリポジトリの規約と事実。変更を取り込むまでの手順は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。\n\n${lines.join("\n")}\n`;
  return { index, missing };
}

function showDiff(target, content) {
  const tmp = join(mkdtempSync(join(tmpdir(), "index-")), "index.md");
  writeFileSync(tmp, content);
  try {
    execFileSync("git", ["diff", "--no-index", "--", target, tmp], { encoding: "utf8" });
    return "";
  } catch (e) {
    if (e.status !== 1) throw e;
    return e.stdout;
  }
}

function fail(msg) {
  console.error(msg);
  process.exit(2);
}
