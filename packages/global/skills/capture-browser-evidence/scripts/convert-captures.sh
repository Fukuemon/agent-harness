#!/usr/bin/env bash
# Playwright / agent-browser の録画 (.webm) を、レビュアーが開ける形へ変換する。
#
# webm(VP8) は macOS の QuickTime とプレビューで再生できず、ホスティングサービスのプレビューでも
# コーデック次第で再生されない。mp4(H.264) へ変換すると、そのまま開ける。
#
# 使い方:
#   convert-captures.sh <入力ディレクトリ> [オプション]
#
# 入力ディレクトリが `webm/` を含む場合は、その隣の `mp4/` へ出す(形式ごとに分ける)。
# `<dir>/webm` を渡しても `<dir>` を渡しても同じ結果になる。
#
# オプション:
#   -o <dir>    出力先。既定は上記の規則
#   -s <倍率>   再生を遅くする倍率。2 で 2 倍の尺になる。既定 1(変換のみ)
#   -f <fps>    出力の fps。既定 30。遅くするときは上げると滑らかになる
#
# 例:
#   # 変換のみ。<置き場所>/<検証名>/before/webm -> <置き場所>/<検証名>/before/mp4
#   convert-captures.sh <置き場所>/<検証名>/before
#   # 1.8 倍の尺にして変換(操作が速すぎて読めないとき)
#   convert-captures.sh <置き場所>/<検証名>/before -s 1.8
#
# NOTE: 撮影時に遅くできるならそちらを優先する(Playwright の launchOptions.slowMo)。
# 後段の引き伸ばしはフレームを補間しないため、動きがカクつく。
# 「読めない録画」の一次対処としては有効だが、証跡の質は撮影時に決まる。

set -euo pipefail

usage() {
  sed -n '2,27p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

[ $# -ge 1 ] || usage
IN_DIR="${1%/}"; shift
SLOW=1
FPS=30
OUT_DIR=""

while getopts ':o:s:f:' opt; do
  case "$opt" in
    o) OUT_DIR="$OPTARG" ;;
    s) SLOW="$OPTARG" ;;
    f) FPS="$OPTARG" ;;
    *) usage ;;
  esac
done

# `<dir>` を渡されたら `<dir>/webm` を入力に取る
if [ ! -d "$IN_DIR" ] && [ -d "$IN_DIR/webm" ]; then
  IN_DIR="$IN_DIR/webm"
elif [ -d "$IN_DIR/webm" ]; then
  IN_DIR="$IN_DIR/webm"
fi
# 出力先は webm/ の隣の mp4/
if [ -z "$OUT_DIR" ]; then
  if [ "$(basename "$IN_DIR")" = "webm" ]; then
    OUT_DIR="$(dirname "$IN_DIR")/mp4"
  else
    OUT_DIR="$IN_DIR"
  fi
fi

command -v ffmpeg >/dev/null || { echo "ffmpeg が要ります" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe が要ります" >&2; exit 1; }
[ -d "$IN_DIR" ] || { echo "入力ディレクトリがありません: $IN_DIR" >&2; exit 1; }

mkdir -p "$OUT_DIR"

converted=0
for src in "$IN_DIR"/*.webm; do
  [ -e "$src" ] || { echo "変換対象の .webm がありません: $IN_DIR" >&2; exit 1; }
  base="$(basename "${src%.webm}")"
  dst="$OUT_DIR/$base.mp4"

  # 表示時刻を倍率で引き伸ばす。音声は録画に含まれないため映像だけを扱う
  filter="fps=$FPS"
  if [ "$SLOW" != "1" ]; then
    filter="setpts=$SLOW*PTS,fps=$FPS"
  fi

  ffmpeg -v error -y -i "$src" \
    -vf "$filter" \
    -c:v libx264 -preset medium -crf 23 \
    -pix_fmt yuv420p -movflags +faststart -an \
    "$dst"

  # 出力の妥当性を確かめる。ファイルの存在は証跡ではない
  read -r codec width height duration < <(
    ffprobe -v error -select_streams v:0 \
      -show_entries stream=codec_name,width,height \
      -show_entries format=duration \
      -of default=nw=1:nk=1 "$dst" | paste -sd' ' -
  )
  if [ "$codec" != "h264" ] || [ -z "$duration" ]; then
    echo "変換に失敗しました: $dst (codec=$codec duration=$duration)" >&2
    exit 1
  fi
  printf '%-58s %s %sx%s %ss\n' "$base.mp4" "$codec" "$width" "$height" "$duration"
  converted=$((converted + 1))
done

echo "変換しました: $converted 本 -> $OUT_DIR"
