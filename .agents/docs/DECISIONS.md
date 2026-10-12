# Architecture decisions

## Accepted

- Repository name stays **agent-workspace**. Clone先の絶対パスには制約を設けない。インストーラーの既定パスは単なる初期値であり、配置要件ではない。
- Workspace is a full, project-scoped AI agent environment. **No global `~/.codex/AGENTS.md` or global symlink**.
- Keep `README.md` and `AGENTS.md` at root for humans and automatic instruction loading; put detailed workspace management docs under `.agents/docs/`.
- Shared agent capabilities belong in `.agents/skills/`; harness-specific config in `.codex/` etc. Don't invent cross-harness settings that don't exist.
- Project work and source-controlled deliverables belong in `projects/`. External Git repositories should normally live beside this repository.
- Do not commit tokens, auth state, machine-local overrides, caches, transient build outputs.
- OS/WSL and generic repository orchestration belongs in `setup` (`AppsToSetup`). Each application's own configuration and dependency installation belongs in its repository's `setup.sh`; Codex is installed by `agent-workspace/setup.sh`. Setup changes are reviewed on `feat/add-agent-harness` before user-approved merge.
- Migrate to Ubuntu **24.04 LTS**, then **remove the old Ubuntu WSL distribution** after verifying the new distribution and checking/backing up any necessary files. Use the exact distribution name returned by `wsl --list --verbose`; `wsl --unregister` irreversibly deletes its data. Prefer modern WSL DNS tunneling; preserve corporate network compatibility.
- Run Koofr's **Windows desktop sync client** under WSL/Windows workflow, not an unnecessary second Koofr Linux client inside WSL. iPhone Obsidian uses **Koofr Sync** plugin, verify on-device.
- Keep live Git trees off cloud mirror; allow normal Git push/pull plus Koofr for non-Git knowledge/artifacts. Sync is not backup.
- Codex first; maintain design separation for Remote Control, Linux home server, and local LLM.

## Deferred / require verification

- Concrete Koofr local folder path, vault location, large artifact layout and backup mechanism.
- Exact WSL DNS/proxy requirements on the user's machine (previous `Temporary failure resolving 'archive.ubuntu.com'`).
- Whether Codex mobile/Remote Control works with the user's account and WSL hosting; no guarantee until tested.
- Google/Slack/LINE connectors and least-privilege scopes; no OAuth tokens in repo.
- Local LLM speed, GPU requirements, remote API availability and benchmark acceptance.
- Subagent/Hooks portability; minimize adapters until a real requirement emerges.
