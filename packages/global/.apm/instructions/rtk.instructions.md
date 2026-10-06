---
description: シェルのコマンドの出力を縮める rtk の使い方
---

# rtk

rtk は、シェルのコマンドの出力を縮めて、トークンを減らす CLI である。

- Claude Code では、フックがコマンドを `rtk <command>` に書き換える。自分で前置しない。
- Codex CLI では、シェルのコマンドの先頭に `rtk` を付ける。例: `rtk git status`
- 縮めない生の出力が要るときは `rtk proxy <command>` を使う。出力の形が想定と違うときは、結論に使う前に `rtk proxy` で確かめる。
- `rtk gain` が失敗するときは、同名の別のツールが入っている。`which rtk` で確かめる。
