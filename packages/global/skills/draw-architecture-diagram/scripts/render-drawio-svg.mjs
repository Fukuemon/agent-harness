#!/usr/bin/env node
// draw.io の図（mxGraphModel）を、draw.io で編集できる SVG に描画する。
//
// SVG の本体に描画の結果を持ち、ルートの content 属性に mxGraphModel を持つ。
// Markdown には画像として埋め込め、draw.io（デスクトップ、VS Code の拡張、Obsidian の Diagrams）で開くと編集できる。
//
// 使い方:
//   render-drawio-svg.mjs <入力> <出力.svg> [--png <確認用.png>] [--inline-icons]
//
// 入力は、mxGraphModel を含むファイル（.drawio、.xml、編集できる SVG）である。
// --png を付けると、出力した SVG をブラウザで開いたスクリーンショットも保存する。
// --inline-icons を付けると、AWS のリソースのアイコンと Kubernetes のアイコンを、SVG の data URI の画像に置き換える。
// 図形の定義（aws4.xml、kubernetes.xml）を持たない draw.io（Obsidian の Diagrams）でも、編集の画面でアイコンが崩れない。
// 置き換えたアイコンは画像になり、編集の画面で別のサービスのアイコンへスタイルで切り替えられない。
//
// 描画には agent-browser と、viewer.diagrams.net の viewer-static.min.js を使う。
// 読み込むのは JS とアイコンの定義だけで、図のデータは外へ送らない。
// agent-browser のコマンドは、環境変数 AGENT_BROWSER_CMD で差し替えられる（空白で区切る）。
//
// 終了コード:
//   0  出力した
//   1  引数か入力の誤り
//   2  描画に失敗した（agent-browser が無い、viewer を読み込めない、時間切れ）

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function usage(message) {
  if (message) console.error(message);
  console.error("使い方: render-drawio-svg.mjs <入力> <出力.svg> [--png <確認用.png>] [--inline-icons]");
  process.exit(1);
}

const args = process.argv.slice(2);
const inlineIndex = args.indexOf("--inline-icons");
const inlineIcons = inlineIndex !== -1;
if (inlineIcons) args.splice(inlineIndex, 1);
const pngIndex = args.indexOf("--png");
let png = null;
if (pngIndex !== -1) {
  png = args[pngIndex + 1];
  if (!png) usage("--png の後にファイル名が無い");
  args.splice(pngIndex, 2);
}
if (args.length !== 2) usage();
const [input, output] = args.map((p) => resolve(p));

let source;
try {
  source = readFileSync(input, "utf8");
} catch {
  usage(`入力を読めない: ${input}`);
}

// 編集できる SVG を入力にしたときは、content 属性から取り出す
const content = source.match(/<svg[^>]*\scontent="([^"]*)"/);
if (content) {
  source = content[1]
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}
const model = source.match(/<mxGraphModel[\s\S]*<\/mxGraphModel>/);
if (!model) usage("mxGraphModel が見つからない。圧縮した .drawio は、draw.io で「圧縮しない」にして保存し直す");
const xml = model[0].replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><");

const cmd = (process.env.AGENT_BROWSER_CMD || "agent-browser").split(/\s+/);
function browser(...rest) {
  const r = spawnSync(cmd[0], [...cmd.slice(1), ...rest], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) {
    console.error(`agent-browser が失敗した: ${rest[0]}\n${r.error?.message ?? r.stderr}`);
    process.exit(2);
  }
  return r.stdout;
}

const work = mkdtempSync(join(tmpdir(), "render-drawio-svg-"));
const page = join(work, "render.html");
// viewer の描画とアイコンの読み込みが終わるまで待つ。短いと、アイコンの無い SVG になる
writeFileSync(
  page,
  `<!doctype html><html><head><meta charset="utf-8">
<script src="https://viewer.diagrams.net/js/viewer-static.min.js"></script></head><body><div id="c"></div><script>
window.xml=${JSON.stringify(xml)};
window.inlineIcons=${inlineIcons};
function fixColors(s){return s.replace(/light-dark\(([^,()]+(?:\([^()]*\))?),\s*[^()]+(?:\([^()]*\))?\)/g,"$1");}
// 図形の定義に頼るアイコンを、その場で描いた SVG の画像に置き換える。ラベルの位置と文字の設定だけを残す
function inlineIconCells(graph){
  var model=graph.getModel(),keep=/^(html|whiteSpace|fontColor|fontSize|fontStyle|labelPosition|verticalLabelPosition|align|verticalAlign|spacing[A-Za-z]*|labelBackgroundColor)=/;
  model.beginUpdate();
  try{
    for(var id in model.cells){
      var c=model.cells[id],st=c.style||"";
      if(!c.vertex||!/shape=mxgraph\.(aws4\.resourceIcon|kubernetes\.icon)/.test(st))continue;
      var tg=new Graph(document.createElement("div"));
      tg.insertVertex(tg.getDefaultParent(),null,"",0,0,c.geometry.width,c.geometry.height,st);
      var icon=fixColors(new XMLSerializer().serializeToString(tg.getSvg(null,1,0,false,null,true,null,null,null,false,false)));
      var rest=st.split(";").filter(function(kv){return keep.test(kv);});
      model.setStyle(c,rest.concat(["shape=image","aspect=fixed","imageAspect=0","image=data:image/svg+xml,"+btoa(unescape(encodeURIComponent(icon)))]).join(";")+";");
    }
  }finally{model.endUpdate();}
  window.xml=mxUtils.getXml(new mxCodec().encode(model));
}
window.addEventListener("load",function(){
  var v=new GraphViewer(document.getElementById("c"),mxUtils.parseXml(window.xml).documentElement,{});
  setTimeout(function(){
    if(window.inlineIcons)inlineIconCells(v.graph);
    var svg=v.graph.getSvg("#ffffff",1,10,true,null,true,null,null,null,false,true);
    svg.setAttribute("content",window.xml);
    window.svgOut=new XMLSerializer().serializeToString(svg);
  },4000);
});
</script></body></html>`,
);

browser("open", pathToFileURL(page).href);
browser("wait", "7000");
let svg;
try {
  svg = JSON.parse(browser("eval", "window.svgOut || ''").trim());
} catch {
  svg = "";
}
if (!svg.startsWith("<svg")) {
  console.error("SVG を得られなかった。viewer.diagrams.net に届くかを確かめる");
  process.exit(2);
}

// draw.io は背景と色を light-dark() で書く。ダークモードの表示で背景だけが黒くなり、文字が読めなくなるので、明るい側に固定する
svg = svg.replace(/background:\s*#ffffff;\s*background-color:\s*light-dark\([^;]*\);/, "background-color: #ffffff;");
svg = svg.replace(/light-dark\(([^,()]+(?:\([^()]*\))?),\s*[^()]+(?:\([^()]*\))?\)/g, "$1");
writeFileSync(output, svg);
console.log(`出力した: ${output}`);

if (png) {
  const size = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (size) browser("set", "viewport", String(Math.ceil(Number(size[1]))), String(Math.ceil(Number(size[2]))));
  browser("open", pathToFileURL(output).href);
  browser("screenshot", resolve(png));
  console.log(`確認用の画像: ${resolve(png)}`);
}
