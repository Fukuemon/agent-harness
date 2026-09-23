# 開発の準備

必要なものは、Node.js の 22.12 以上、pnpm、microsoft/apm の 3 つである。

```sh
pnpm install
apm install
```

- `pnpm install` は、Git のフックも有効にする。
- `apm install` は、`apm.yml` に書いたスキルを配置する。配置先と直し方は [スキルの置き場所](context/skills.md) に書いてある。
- microsoft/apm の導入の方法は、公式の案内に従う。
  - [microsoft/apm](https://github.com/microsoft/apm)
- 常設せずに試す場合は、uv の一時実行が使える。

```sh
uvx --from apm-cli apm install
```

## 文書を直すとき

```sh
pnpm lint:text
```

対象は、ルート、`adr/`、`design/`、`context/`、`skills/` の Markdown である。  
書き方の規則は `skills/docs-writing/SKILL.md` にある。

## コミットするとき

- コミットの前に、ステージした Markdown を textlint でチェックする。
- コミットメッセージは commitlint でチェックする。Conventional Commits の形式に加えて、要約の末尾の句点と、AI の帰属表示を禁止している。
- メッセージの書き方と変更の分け方は `skills/git-commit/SKILL.md` にある。
- ブランチの切り方と main への取り込み方は [ブランチとリリース](context/branch-and-release.md) にある。
