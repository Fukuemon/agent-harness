# context の目次

作業の中で参照する、このリポジトリの規約と事実。変更をマージするまでの手順は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。

- [コードベースの構造](codebase.md) — パッケージとリポジトリ自身の境界、依存してよい向き、値の置き場、新しいファイルの置き場。コードから読み取れる構造は書かない
- [コーディングエージェントごとの対応](coding-agents.md) — コーディングエージェントごとのスキルの配置先、フックの入力と実行の条件、プラグインで入れたときの条件、確認したバージョン。パッケージの本文に書かない名前ごとの違いは、ここだけが持つ
- [コードと文書の規約](conventions.md) — スクリプトとスキルの名前の付け方、コメント、文書の書き方のうちこのリポジトリだけの規則、共有の設定の所在、自動チェックの除外。lint で検出できる規則は書かない
- [業務の知識](domain.md) — 用語の所在と、状態を持つ概念の一覧。用語は PRD の Ubiquitous Language が持ち、ここには写さない
- [基盤と運用](operations.md) — このリポジトリが動く場所、配布の条件、正常の判断、切り戻し、秘密情報の方針
- [スキルの置き場所](skills.md) — このリポジトリの開発に使うスキルの元の場所と、コーディングエージェントが読む写しの作り方
- [技術スタック](tech-stack.md) — このリポジトリの開発に使うツールの役割とバージョンの所在、バージョンを上げるときの確認、新しいパッケージとスキルの作り始め。バージョンそのものと選んだ理由は書かない
- [テスト](testing.md) — スクリプトのテストの形と保証、実行に要る環境、置き換えをしない方針、変更に足すテスト

## Design Doc

- [AI エージェントにプロジェクト固有の知識と自動チェックを与える agent-harness PRD](../PRD.md) — 固有の知識、自動チェック、開発プロセスの標準を、複数のリポジトリで複製せずに使えるようにする（draft）
- [agent-harness Design Doc](../design/DesignDoc.md) — agent-harness の全体像。パッケージの一覧と責務、配布の形、パッケージに共通する方針を書く（draft）
- [開発プロセス](../design/features/process/DesignDoc_process.md) — 開発のプロセスの種類、要求ごとの選択、選んだ結果の宣言、agent-harness とワークフローのハーネスの分担（draft）
- [core](../packages/core/DesignDoc.md) — 利用者のリポジトリに固有の知識の置き場を作るパッケージ。値のファイル、context、目次、AGENTS.md、導入のスキル（draft）
- [デザインシステム](../packages/design-system/DesignDoc.md) — パッケージ design-system の設計。トークンの段の分け方、デザインシステムの文書の型、アクセシビリティの基準と確認の方法、カタログの構成、読むキー、スキルと雛形（draft）
- [文書のサイト](../packages/docs-site/DesignDoc.md) — パッケージ docs-site の設計。文書、カタログ、図を 1 つのサイトに並べて公開先へ公開する構成と、保護の手順（draft）
- [文書の体系](../packages/docs/DesignDoc.md) — Design Doc、ADR、spec の種類とライフサイクル、実装とのずれの検出、spec を削除する前の保証、文書のチェック（draft）
- [E2E](../packages/e2e/DesignDoc.md) — パッケージ e2e の設計。E2E のテストの書き方のスキル、録画とエビデンスとログインの kit のコード、テストの書き方の lint の規則の構成と、kit のビルドとテストと配り方（draft）
- [画面仕様書](../packages/screens/DesignDoc.md) — パッケージ screens の設計。画面ごとの状態、構成要素、操作できるモックの型、モックの共通のファイル、規約の点検、機能の Design Doc との分担（draft）
- [検証](../packages/verification/DesignDoc.md) — パッケージ verification の設計。観点の設計、検証の spec、撮影と確認、pull request へのエビデンスの添付の責務、読むキー、スキルと雛形（draft）
