---
type: context
title: スキルの置き場所
description: このリポジトリの開発に使うスキルの元の場所と、コーディングエージェントが読む写しの作り方
status: stable
keywords: [skills, apm.yml, .claude/skills, .agents/skills]
governs:
  - apm.yml
  - .gitignore
verified_commit: 79836caed43c41802352d29cc38210a858a7f66a
---

# スキルの置き場所

このリポジトリの開発に使うスキルの元は `skills/` にある。`apm.yml` が、このディレクトリのスキルを列挙している。

- `.claude/skills/` と `.agents/skills/` は、`apm install` が作る写しである。Git で管理しない。
- 写しを直接は直さない。次の `apm install` で上書きされる。
- `skills/` を直したら、`apm install` を実行して写しへ反映する。`apm.lock.yaml` が写しのハッシュを記録するため、ロックファイルの変更も同じコミットに含める。
