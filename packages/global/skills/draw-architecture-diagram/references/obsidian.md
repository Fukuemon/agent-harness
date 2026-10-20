# Obsidian の Diagrams プラグインで表示する

プラグインは `drawio-obsidian`（Diagrams、1.5.4 で確認）である。条件は、プラグインの `main.js` と、プラグインと同じ手順で draw.io を起動した再現から確かめた。

- 拡張子 `.svg` のファイルを、ルートの `content` 属性に `mxfile`、`mxGraphModel`、`mxGraph` のどれかを持つときに、図として扱う。
- SVG のファイルを開くと画像の表示になる。右上の鉛筆（Edit diagram）を押すと、編集の画面になる。
- 編集の画面は、図を draw.io に渡してから 5 秒以内に読み込みの完了が返らないと、画像の表示に戻す。
- 保存すると、SVG の本体と `content` 属性をプラグインが書き直す。`content` は `mxGraphModel` のまま書かれる。

## 画面の形が sketch だと編集の画面でエラーになる

プラグインの設定の画面の形（`theme.layout`）の既定は `sketch` である。`sketch` では、編集の画面を開くと `Uncaught TypeError: Cannot set properties of null (setting 'innerHTML')` が出る。draw.io の `EditorUi.prototype.setStatusText` が、`sketch` の画面に無い `statusContainer` に書くためである。図の中身に関係なく、プラグインで作った図でも出る。

- 利用者に、プラグインの設定で画面の形を `full` か `compact` にするよう伝える。設定は `.obsidian/plugins/drawio-obsidian/data.json` に保存される。

## AWS と Kubernetes のアイコンは編集の画面で四角になる

プラグインが同梱する draw.io は、図形の定義（`aws4.xml`、`kubernetes.xml`）を含まない。`resourceIcon` の AWS のアイコンと Kubernetes のアイコンは、編集の画面で色の付いた四角になる。グループ、ALB、利用者、VPC Peering は表示される。

- `render-drawio-svg.mjs` に `--inline-icons` を付けて描画すると、アイコンが SVG の data URI の画像になり、編集の画面でも同じ見た目で表示される。
- 置き換えずに編集の画面で保存すると、四角のアイコンのまま SVG の本体が書き直されるおそれがある。保存までは確かめていない。

## 添付の名前を変えるプラグインとの組み合わせ

attachment-management のように、添付を規則の名前（例: `IMG-<日時>`）と置き場へ移すプラグインがあると、置いた SVG の名前と場所が変わる。

- 設定は `.obsidian/plugins/<プラグイン>/data.json` にある。置く前に読み、規則の置き場と名前で置く。
- 移された後は、ノートの埋め込みのリンクも新しい名前になる。描画し直すときは、新しい名前のファイルに上書きする。
