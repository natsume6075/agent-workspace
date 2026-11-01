---
name: repo-delivery
description: setup/bootstrap へのリポジトリ統合、複数リポジトリの責務や成果物の切り分け、PR・main を含む作業完了確認を行うときに使う。単一リポジトリ内の通常の実装変更には使わない。
---

# Repository delivery and setup integration

Use this skill at setup-integration requests and at the end of a repository-based project when the user asks to check delivery completeness. Keep it out of ordinary implementation work that does not affect repository boundaries, setup, or delivery.

## Establish scope and ownership

- Inspect the relevant repositories independently: instructions, setup scripts, README, branch/remotes, staged and unstaged changes, ignored paths, and current PR/main state. Preserve unrelated dirty work.
- Identify the orchestrator repo, each child repo, and any project workspace. Keep their responsibilities separate.
- In a setup ecosystem that already offers per-app y/n choices, integrate a child through that convention: fetch/run its own `setup.sh` only after `y`; `n` must skip it. Reuse existing destinations without implicit update or overwrite. Do not add a second parent-owned installer for child-specific behavior.
- Follow the target repository's branch/review instructions. In this agent workspace, setup changes use `feat/add-agent-harness`; check whether that branch and any previous PR are already merged before reusing it.
- The parent setup repo owns generic bootstrap flow and broadly applicable platform instructions. A child repo owns its dependencies, model/runtime details, configuration, and operation instructions. Avoid copying volatile child-repo steps or inventories into the parent README; link to the child README only where useful.
- A project workspace is distinct from its engine when it has its own prompts, task guidance, or run history. Do not add a project-specific workspace to generic OS setup merely because its engine is installed there; first check whether the existing destination and lifecycle conventions fit.

## Separate recipes from runtime products

Classify files by purpose, not extension:

- Source control normally contains code, setup recipes, dependency/model manifests and hashes, reusable workflow templates, tests, and maintained documentation.
- Runtime data normally stays outside source control: generated images/audio/video, intermediate outputs, user reference/input media, downloaded model weights, caches, execution locks, user settings, and per-run metadata/JSON. A workflow JSON is a recipe; a JSON result record is generated data.
- If the user wants selected products versioned, put only the explicitly chosen deliverables in a clear asset/output location. Do not infer that every generated result belongs in Git.
- Add or maintain narrow `.gitignore` rules for runtime paths. Verify representative paths with `git check-ignore`, confirm runtime paths are not already tracked with `git ls-files`, and inspect the staged diff/PR file list. Ignoring a path does not untrack files already in Git.
- Avoid `git add .` in mixed source/runtime trees. Stage explicit source paths and inspect `git diff --cached` before committing.

For an engine plus a project workspace, a useful boundary is: engine repo = implementation and reproducible recipes; workspace repo = agent instructions and project-specific prompt practice; ignored workspace data directory = inputs, outputs, metadata, and state. Configure paths through supported options/environment variables instead of letting routine use write into the engine source tree. Preserve existing runtime data when changing paths; migrate only when safe and in scope.

## Place documentation with its owner

- Parent README: how the overall setup is started, generic choices, and broad platform behavior.
- Child README: that child's setup prompts, model/version details, commands, storage paths, limitations, and restoration.
- Workspace instructions: how the agent should use the engine, where runtime data goes, and how to iterate/review products.
- Keep validation evidence and remaining work in the relevant project's existing task/results files. Do not duplicate project status into the agent-harness ledger unless the harness itself changed.
- Prefer deleting redundant parent documentation over maintaining a second, increasingly stale description of child setup internals. Do not combine unrelated tools or products under one heading without a real shared purpose.

## Verify and deliver per repository

- Use each repository's actual default branch name (`main` or `master`). For an existing remote repo, keep changes on a focused branch, validate the source-only diff, open the requested PR, inspect its files/status, and merge only when the user authorized merging. Then fast-forward the local default branch and verify clean status.
- For a newly created, empty remote repository, an initial source-only commit may be pushed directly to its default branch; there is no existing base for a meaningful PR. Use PRs for subsequent changes.
- Report separately for every affected repo: current branch/main or PR state, changes made, validation, whether products/models entered Git, and remaining actions. Do not describe static checks as runtime verification; name user-side or hardware checks that remain.

## Final report shape

Use concise repository-by-repository bullets, for example:

- **`setup`** — y/n integration status; parent README scope; PR and merge state; remaining setup checks.
- **`engine-repo`** — recipe/runtime separation; PR/main state; tests; generated-product audit.
- **`project-workspace`** — tracked instructions versus ignored data; remote/commit/PR state; runtime checks still needed.
