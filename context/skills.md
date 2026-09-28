---
type: context
title: スキルの置き場所
description: このリポジトリの開発に使うスキルの元の場所と、コーディングエージェントが読む写しの作り方
status: stable
keywords: [skills, apm.yml, .claude/skills, .agents/skills]
governs:
  - apm.yml
  - .gitignore
verified_commit: d45aeafb7bb083783d5c2f77d1a2dfb2a2acbe94
---

# スキルの置き場所

このリポジトリの開発に使うスキルの元は 2 か所にある。  
このリポジトリだけのスキル（docs-writing）は `skills/` にある。  
利用者にも届けるスキルは `packages/core/skills/` と `packages/docs/skills/` にある。  
core のスキルは、setup-agent-harness、write-harness-context、git-commit、issue-pr-writing、code-comments の 5 つである。  
docs のスキルは、write-design-docs と setup-design-docs の 2 つである。  
`apm.yml` が両方を列挙している。

- `.claude/skills/` と `.agents/skills/` は、`apm install` が作る写しである。Git で管理しない。
- core と docs のフックも `apm install` が配置する。フックの設定は `.claude/settings.json` と `.codex/hooks.json` に統合され、Git で管理する。apm がどの項目を統合したかの記録 `.claude/apm-hooks.json` と `.codex/apm-hooks.json` も管理する。記録がないと、clone 直後の `apm install` が既存の項目を利用者のものと見て、同じ項目を重ねて足すためである。スクリプトの写し `.claude/hooks/` と `.codex/hooks/` は管理しない。
- 写しを直接は直さない。次の `apm install` で上書きされる。
- `skills/` か `packages/` を直したら、`apm install` を実行して写しへ反映する。`apm.lock.yaml` が写しのハッシュを記録するため、ロックファイルの変更も同じコミットに含める。pre-commit は、`packages/`、`skills/`、`apm.yml`、`apm.lock.yaml` の変更を含むコミットで `apm install` を実行する。ロックファイルと、フックの設定と記録の 4 ファイルをステージする。CI は、この 5 ファイルに差分も未追跡もないことを確かめる。
- apm の版は `mise.toml` にあり、`apm.lock.yaml` の `apm_version` と揃える。版を上げるときは、両方を同じコミットで変える。
