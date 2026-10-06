#!/usr/bin/env python3
"""Playwright の JSON レポートから録画を取り出し、内容の分かる名前で並べる。

Playwright が録画を置くディレクトリ名は**テスト名を途中で切る**ため、
ディレクトリ名で照合すると長いテスト名を取りこぼす。
JSON レポートには完全なテスト名と動画の実パスが入っているので、そこから取る。

出力は形式ごとにディレクトリを分ける。

    <out>/
    └── webm/  # Playwright が出した元ファイル

`.mp4` へは convert-captures.sh で変換する(出力は <out>/mp4/)。

使い方:
    # 1. JSON レポートを出しながら撮る
    npx playwright test --config <置き場所>/playwright.capture.config.ts \\
      --reporter=json <specs> > report.json

    # 2. 取り出す
    collect-playwright-videos.py report.json <出力ディレクトリ> --prefix before

ファイル名は `<prefix>-<spec ファイル名>-<連番>-<describe 名>-<テスト名>.webm` になる。
連番は spec ファイルごとに 1 から振る。

**同じ spec に同名のテストが並ぶことがある**(画面ごとに describe を分け、
中の観点名が同じ場合)。そのため describe 名も名前へ入れる。
describe 名が丸カッコで画面名を持つときは、その中だけを使う。

終了コード:
    0  全部のテストの録画を取り出した
    1  録画が無いテストがある。標準エラーにテスト名を出す
    2  引数の誤り
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import shutil
import sys

# ファイル名に使えない文字と、シェルで扱いにくい空白を落とす
_UNSAFE = re.compile(r'[\\/:*?"<>|\s]+')


def sanitize(text: str) -> str:
    return _UNSAFE.sub('', text).strip('-_.')


# describe 名が「…の回帰(一覧画面)」のとき、丸カッコの中だけを使う
_GROUP_IN_PARENS = re.compile(r'[(（]([^()（）]+)[)）]\s*$')

# describe 名をそのまま使う場合の最大長。ファイル名が伸びすぎるのを防ぐ
_GROUP_MAX = 24


def group_label(title: str) -> str:
    matched = _GROUP_IN_PARENS.search(title)
    return sanitize(matched.group(1) if matched else title[:_GROUP_MAX])


def iter_specs(node: dict, group: str = ''):
    """suites は入れ子になるため再帰で spec を集める。describe 名も一緒に返す。"""
    for spec in node.get('specs', []):
        yield spec, group
    for suite in node.get('suites', []):
        yield from iter_specs(suite, group_label(suite.get('title', '')) or group)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report', help='Playwright の JSON レポート')
    parser.add_argument('out_dir', help='出力ディレクトリ。配下に webm/ を作る')
    parser.add_argument('--prefix', required=True, help='ファイル名の先頭に付ける識別子(ブランチ名など)')
    args = parser.parse_args()

    report = json.loads(pathlib.Path(args.report).read_text(encoding='utf-8'))
    out = pathlib.Path(args.out_dir) / 'webm'
    out.mkdir(parents=True, exist_ok=True)

    copied = 0
    missing: list[str] = []
    for suite in report.get('suites', []):
        # spec ファイル単位で連番を振る
        spec_file = pathlib.Path(suite.get('file', 'unknown')).name
        spec_slug = sanitize(re.sub(r'(\.(spec|test|e2e))?\.[cm]?[jt]sx?$', '', spec_file))
        for index, (spec, group) in enumerate(iter_specs(suite), start=1):
            title = sanitize(spec.get('title', f'test{index}'))
            group_part = f'{group}-' if group else ''
            videos = [
                attachment['path']
                for test in spec.get('tests', [])
                for result in test.get('results', [])
                for attachment in result.get('attachments', [])
                if attachment.get('name') == 'video' and attachment.get('path')
            ]
            if not videos:
                missing.append(spec.get('title', ''))
                continue
            for suffix, src in enumerate(videos):
                # 同一テストで複数タブを録った場合はどのタブかを番号で残す
                tab = '' if len(videos) == 1 else f'-tab{suffix + 1}'
                name = f'{args.prefix}-{spec_slug}-{index:02d}-{group_part}{title}{tab}.webm'
                shutil.copy2(src, out / name)
                copied += 1
                print(f'  {name}')

    print(f'取り出しました: {copied} 本 -> {out}')
    if missing:
        # 「取れなかったこと」を黙って捨てない
        print('録画が無いテスト:', file=sys.stderr)
        for title in missing:
            print(f'  - {title}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
