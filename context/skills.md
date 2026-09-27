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

このリポジトリの開発に使うスキルの元は `skills/` にある。`apm.yml` が、このディレクトリのスキルと、パッケージ `packages/core` を列挙している。  
このリポジトリは core の利用者でもあり、core のスキル（setup-agent-harness、write-harness-context）も同じ写しの場所に配置される。

- `.claude/skills/` と `.agents/skills/` は、`apm install` が作る写しである。Git で管理しない。
- 写しを直接は直さない。次の `apm install` で上書きされる。
- `skills/` を直したら、`apm install` を実行して写しへ反映する。`apm.lock.yaml` が写しのハッシュを記録するため、ロックファイルの変更も同じコミットに含める。
