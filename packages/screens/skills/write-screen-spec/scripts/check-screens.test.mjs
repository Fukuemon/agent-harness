// check-screens.mjs を、使い捨てのリポジトリに写した雛形と、テストの中で書いた画面に対して実行する。
// 実行: node --test packages/screens/skills/write-screen-spec/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const script = fileURLToPath(new URL("check-screens.mjs", import.meta.url));
const templates = fileURLToPath(new URL("../references/screens/", import.meta.url));
const schema = fileURLToPath(new URL("../../../schemas/screens.schema.json", import.meta.url));

const SCREEN = "docs/screens/order-list_注文の一覧";

const spec = (body = "") => `# order-list 注文の一覧

注文を一覧する。

| 項目 | 値 |
| --- | --- |
| URL | \`/order\` |
| 使う人 | 全ての利用者 |
| 実装 | なし |

画面の項目と、API の項目の対応は [API との対応](api.md) にある。

## 構成

=== "初期表示"

    注文があるとき。

    <iframe class="mock" title="注文の一覧の初期表示" src="mocks/01-initial.html"></iframe>
    <a class="mock-open" href="mocks/01-initial.html" target="_blank">別タブで開く</a>

    | 番号 | 種別 | 要素名 | 仕様 |
    | --- | --- | --- | --- |
    | 1 | ボタン | 注文する | [注文する](#注文する) |

## 注文する

**概要**: 注文を作る。

**値のソース**: 「注文する」

**活性条件**: 常に活性

**表示条件**: 常に表示
${body}
## 全体動作

なし。

## 未決

なし。
`;

const mock = ({ head = "", button = '<button type="button" class="wf-btn" data-m="1" data-testid="order-list-submit">注文する</button>' } = {}) => `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>order-list 初期表示</title>
    <link rel="stylesheet" href="../../_common/mock.css" />
${head}    <link rel="stylesheet" href="../../_common/wireframe.css" />
    <link rel="stylesheet" href="order-list.css" />
  </head>
  <body data-view="desktop">
    <div class="stage">
      <div class="screen">
        <div class="screen-body">
          ${button}
        </div>
      </div>
      <div class="markers"></div>
    </div>
    <script src="../../_common/mock.js"></script>
    <script src="../../_common/interact.js"></script>
  </body>
</html>
`;

function repo({ project = "", files = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "check-screens-"));
  cpSync(templates, join(dir, "docs/screens"), { recursive: true });
  mkdirSync(join(dir, "context"));
  writeFileSync(join(dir, "context/project.yml"), `version: 2\n${project}`);
  mkdirSync(join(dir, SCREEN, "mocks"), { recursive: true });
  const all = {
    [`${SCREEN}/index.md`]: spec(),
    [`${SCREEN}/api.md`]: "# order-list API との対応\n\nなし。\n",
    [`${SCREEN}/mocks/order-list.css`]: "/* 注文の一覧のモックだけの見た目 */\n",
    [`${SCREEN}/mocks/01-initial.html`]: mock(),
    ...files,
  };
  for (const [path, body] of Object.entries(all)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    writeFileSync(join(dir, path), body);
  }
  return dir;
}

function run(cwd, args = []) {
  try {
    const stdout = execFileSync("node", [script, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out: stdout };
  } catch (e) {
    return { code: e.status, out: `${e.stdout}${e.stderr}` };
  }
}

test("規約に合う画面は、終了コード 0 で終わる", () => {
  const r = run(repo());
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /1 画面が規約に合っている/);
});

test("雛形のテンプレートをそのまま写した画面は、消し忘れを終了コード 1 で報告する", () => {
  const dir = repo();
  cpSync(join(dir, "docs/screens/_template"), join(dir, "docs/screens/order-new_注文の作成"), { recursive: true });
  renameSync(join(dir, "docs/screens/order-new_注文の作成/mocks/screen-id.css"), join(dir, "docs/screens/order-new_注文の作成/mocks/order-new.css"));
  const r = run(dir, ["docs/screens/order-new_注文の作成"]);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /テンプレートの <画面 ID> が残っている/);
});

test("表の番号とモックの data-m が食い違うと、終了コード 1 で報告する", () => {
  const button = '<button type="button" class="wf-btn" data-m="2" data-testid="order-list-submit">注文する</button>';
  const r = run(repo({ files: { [`${SCREEN}/mocks/01-initial.html`]: mock({ button }) } }));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /番号 1 が mocks\/01-initial.html の data-m に無い/);
  assert.match(r.out, /data-m が 1 から欠番なく続いていない/);
});

test("禁止の記述と、先の無い操作の属性を、終了コード 1 で報告する", () => {
  const button = '<button type="button" class="wf-btn" data-m="1" data-go="02-done.html" data-testid="order-list-submit">注文する</button>';
  const r = run(repo({
    files: {
      [`${SCREEN}/mocks/01-initial.html`]: mock({ button }),
      [`${SCREEN}/mocks/order-list.css`]: ".x { position: fixed; height: 100vh; }\n",
    },
  }));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /data-go="02-done.html" のモックが無い/);
  assert.match(r.out, /position: fixedを使わない/);
  assert.match(r.out, /viewport の単位を使わない/);
});

test("インラインの SVG の xmlns は、外部の URL として報告しない", () => {
  const button = '<button type="button" class="wf-btn" data-m="1" data-testid="order-list-submit"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"></svg>注文する</button>';
  const r = run(repo({ files: { [`${SCREEN}/mocks/01-initial.html`]: mock({ button }) } }));
  assert.equal(r.code, 0, r.out);
});

test("screens.tokens_css があると、モックがトークンの CSS を mock.css の次に読むことを求める", () => {
  const project = "screens:\n  tokens_css: docs/tokens.css\n";
  const files = { "docs/tokens.css": ":root {}\n" };
  assert.equal(run(repo({ project, files })).code, 1);
  const head = '    <link rel="stylesheet" href="../../../tokens.css" />\n';
  const r = run(repo({ project, files: { ...files, [`${SCREEN}/mocks/01-initial.html`]: mock({ head }) } }));
  assert.equal(r.code, 0, r.out);
});

test("screens.catalog_url があるときだけ、カタログの欄のリンクの始まりを見る", () => {
  const files = { [`${SCREEN}/index.md`]: spec("\n**カタログ**: [Button の Default](https://example.com/other/button)\n") };
  assert.equal(run(repo({ files })).code, 0);
  const r = run(repo({ project: "screens:\n  catalog_url: https://example.com/catalog/\n", files }));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /screens.catalog_url の下でない/);
});

test("screens.e2e_dir があり、全ての画面を見るときだけ、テストの testid がモックにあるかを見る", () => {
  const project = "screens:\n  e2e_dir: e2e\n";
  const found = 'page.getByTestId("order-list-submit")\n';
  const missing = 'page.getByTestId("order-list-cancel")\n';
  assert.equal(run(repo({ project, files: { "e2e/a.spec.ts": found } })).code, 0);
  const r = run(repo({ project, files: { "e2e/a.spec.ts": missing } }));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /テストの testid order-list-cancel がどのモックの data-testid にも無い/);
});

test("テストのコードのコメントの中の getByTestId は見ない", () => {
  const code = [
    '// 消した: page.getByTestId("order-list-cancel")',
    '/* page.getByTestId("order-list-close") */',
    'await page.goto("https://example.com/"); page.getByTestId("order-list-submit")',
  ].join("\n");
  const r = run(repo({ project: "screens:\n  e2e_dir: e2e\n", files: { "e2e/a.spec.ts": code } }));
  assert.equal(r.code, 0, r.out);
});

test("モックの {…} の形に当たる testid は、モックにあるとみなす", () => {
  const button = '<button type="button" class="wf-btn" data-m="1" data-testid="order-list-row-{注文の ID}">注文</button>';
  const r = run(repo({
    project: "screens:\n  e2e_dir: e2e\n",
    files: { [`${SCREEN}/mocks/01-initial.html`]: mock({ button }), "e2e/a.spec.ts": 'page.getByTestId("order-list-row-42")\n' },
  }));
  assert.equal(r.code, 0, r.out);
});

test("screens.dir の画面の置き場が無いと、終了コード 2 で終わる", () => {
  const r = run(repo({ project: "screens:\n  dir: docs/ui\n" }));
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /screens.dir を確認する/);
});

test("screens のキーの値は、引用符と行末のコメントを外して読む", () => {
  const project = `screens:\n  dir: "docs/screens" # 画面仕様書\n  catalog_url: 'https://example.com/catalog/' # カタログ\n  e2e_dir: e2e # テスト\n`;
  const files = {
    [`${SCREEN}/index.md`]: spec("\n**カタログ**: [Button の Default](https://example.com/catalog/button)\n"),
    "e2e/a.spec.ts": 'page.getByTestId("order-list-submit")\n',
  };
  const r = run(repo({ project, files }));
  assert.equal(r.code, 0, r.out);
});

test("screens のキーの値が相対パスでないと、終了コード 2 で終わる", () => {
  const r = run(repo({ project: "screens:\n  e2e_dir: ../e2e\n" }));
  assert.equal(r.code, 2, r.out);
});

test("mock.js の VIEWS から読んだデバイスにない data-view を報告する", () => {
  const dir = repo();
  const path = join(dir, SCREEN, "mocks/01-initial.html");
  writeFileSync(path, readFileSync(path, "utf8").replace('data-view="desktop"', 'data-view="watch"'));
  const r = run(dir);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /body の data-view を mobile、tablet、tablet-wide、desktop のどれかにする/);
});

test("schema は screens のキーの相対パスと URL を受け、絶対パスを拒む", () => {
  const validate = new Ajv2020({ allErrors: true }).compile(JSON.parse(readFileSync(schema, "utf8")));
  assert.ok(validate({ version: 2, screens: { dir: "docs/screens", tokens_css: "docs/tokens.css", catalog_url: "https://example.com/catalog/", e2e_dir: "e2e" } }), JSON.stringify(validate.errors));
  assert.ok(!validate({ version: 2, screens: { dir: "/docs/screens" } }));
  assert.ok(!validate({ version: 2, screens: { catalog_url: "catalog" } }));
});

test("getByTestId の引数がリテラルで始まらなければ、違反にせず件数を出して飛ばす", () => {
  const code = [
    "page.getByTestId(SUBMIT)",
    "page.getByTestId(`${prefix}-row-${i}`)",
    "page.getByTestId(`order-list-${String(1)}`)",
  ].join("\n");
  const r = run(repo({ project: "screens:\n  e2e_dir: e2e\n", files: { "e2e/a.spec.ts": code } }));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /getByTestId の引数 2 件は、照らさずに飛ばした/);
});

test("引数で画面を渡したときは、テストの testid を見ない", () => {
  const files = { "e2e/a.spec.ts": 'page.getByTestId("order-list-cancel")\n' };
  assert.equal(run(repo({ project: "screens:\n  e2e_dir: e2e\n", files }), [SCREEN]).code, 0);
});

test("単引用符の data-testid も、モックの testid として読む", () => {
  const button = "<button type=\"button\" class=\"wf-btn\" data-m='1' data-testid='order-list-submit'>注文する</button>";
  const r = run(repo({
    project: "screens:\n  e2e_dir: e2e\n",
    files: { [`${SCREEN}/mocks/01-initial.html`]: mock({ button }), "e2e/a.spec.ts": 'page.getByTestId("order-list-submit")\n' },
  }));
  assert.equal(r.code, 0, r.out);
});

test("構成のセクションで、空行の後の字下げのない文はタブを閉じる", () => {
  const table = "    | 1 | ボタン | 注文する | [注文する](#注文する) |\n";
  const after = spec().replace(table, `${table}\nどの状態でも、注文の数を見出しに出す。\n`);
  assert.equal(run(repo({ files: { [`${SCREEN}/index.md`]: after } })).code, 0);
  const joined = spec().replace(table, `${table}字下げを忘れた行。\n`);
  const r = run(repo({ files: { [`${SCREEN}/index.md`]: joined } }));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /タブの中身を 4 つの空白で字下げする/);
});

test("4 文字のフェンスの中の 3 文字のフェンスでは、フェンスを閉じない", () => {
  const nested = "    ````markdown\n    ```html\n    <iframe src=\"x.html\"></iframe>\n    ```\n    ````\n\n";
  const md = spec().replace("    <iframe class=", `${nested}    <iframe class=`);
  const r = run(repo({ files: { [`${SCREEN}/index.md`]: md } }));
  assert.equal(r.code, 0, r.out);
});

test("カタログの欄の、タイトル付きのリンクを読み、catalog_url の外のドメインを通さない", () => {
  const project = "screens:\n  catalog_url: https://example.com\n";
  const titled = spec('\n**カタログ**: [Button の Default](https://example.com/catalog/button "Button")\n');
  assert.equal(run(repo({ project, files: { [`${SCREEN}/index.md`]: titled } })).code, 0);
  const evil = spec("\n**カタログ**: [Button の Default](https://example.com.evil/button)\n");
  const r = run(repo({ project, files: { [`${SCREEN}/index.md`]: evil } }));
  assert.equal(r.code, 1, r.out);
});

test("screens を flow の形やブロックのスカラーで書くと、終了コード 2 で終わる", () => {
  assert.equal(run(repo({ project: "screens: {dir: docs/screens}\n" })).code, 2);
  assert.equal(run(repo({ project: "screens:\n  dir: |\n    docs/screens\n" })).code, 2);
});

test("screens.e2e_dir がファイルなら、終了コード 2 で終わる", () => {
  const r = run(repo({ project: "screens:\n  e2e_dir: e2e.ts\n", files: { "e2e.ts": "\n" } }));
  assert.equal(r.code, 2, r.out);
});
