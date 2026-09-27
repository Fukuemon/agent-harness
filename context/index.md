# context の目次

作業の中で参照する、このリポジトリの規約と事実。変更を取り込むまでの手順は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。

- [コードベースの構造](codebase.md) — モジュールの境界、依存してよい向き、状態の置き場、新しいコードの置き場。コードから読み取れる構造は書かない（draft）
- [コードの規約](conventions.md) — 命名、コメント、共有の設定、自動チェックの除外。lint で検出できる規則は書かない（draft）
- [業務の知識](domain.md) — 用語の定義と、概念ごとの文書の一覧。状態と遷移、不変条件は概念ごとに domain/ に置く（draft）
- [基盤と運用](operations.md) — 環境の種類、デプロイと切り戻しの条件、監視、秘密情報の置き場の方針（draft）
- [スキルの置き場所](skills.md) — このリポジトリの開発に使うスキルの元の場所と、コーディングエージェントが読む写しの作り方
- [技術スタック](tech-stack.md) — 採用しているツールの役割と版の所在、版の更新の確認、新しいモジュールの作り始め。版そのものと選んだ理由は書かない（draft）
- [テスト](testing.md) — テストの種類ごとの責務、実行に要る環境の条件、置き換えの方針、変更に足すテスト（draft）

## Design Doc

- [agent-harness Design Doc](../design/DesignDoc.md) — agent-harness の全体像。パッケージの一覧と責務、配布の形、パッケージに共通する方針を書く（draft）
- [文書の体系](../design/features/documents/DesignDoc_documents.md) — Design Doc、ADR、spec の種類と寿命、実装とのずれの検出、spec を削除する前の保証、文書のチェック（draft）
- [ガードレール](../design/features/guardrails/DesignDoc_guardrails.md) — 取り返しのつかない操作を止める仕組みと、プロダクトごとに有効にする規則。保護ブランチ、禁止するコマンド、秘密情報（draft）
- [開発プロセス](../design/features/process/DesignDoc_process.md) — 開発のプロセスの種類、要求ごとの選択、選んだ結果の宣言、agent-harness とワークフローのハーネスの分担（draft）
