# agent-harness

AI エージェントにプロジェクト固有の知識とガードレールを与える、小さなパッケージと運用ルール。

複数のリポジトリで Claude Code や Codex CLI を使う開発者が対象である。  
規約、スキル、フックを、モデルが進化しても要るものだけに絞り、どのプロジェクトでも同じ形で使えるようにする。

- 何を解決するかは [PRD](PRD.md) に書いてある。
- 決定済みの設計は [Design Doc](DesignDoc.md) に書いてある。
- 選択肢を比較して決めた判断は [adr/](adr/) に書いてある。

## 開発の準備

必要なものは、Node.js の 22.12 以上、pnpm、microsoft/apm の 3 つである。

```sh
pnpm install
apm install
```

- `pnpm install` は、Git のフックも有効にする。コミットの前に、ステージした Markdown を textlint でチェックする。コミットメッセージは commitlint でチェックする。
- `apm install` は、`apm.yml` に書いたスキルを `.claude/skills/` と `.agents/skills/` へ配置する。配置先は Git で管理しない。
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

書き方の規則は `skills/docs-writing/SKILL.md` にある。
