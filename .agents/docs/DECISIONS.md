# Architecture decisions

## Accepted

- Repository name stays **agent-workspace**, path **`~/workspace/agent-workspace`**.
- Workspace is a full, project-scoped AI agent environment. **No global `~/.codex/AGENTS.md` or global symlink**.
- Keep `README.md` and `AGENTS.md` at root for humans and automatic instruction loading; put detailed workspace management docs under `.agents/docs/`.
- Shared agent capabilities belong in `.agents/skills/`; harness-specific config in `.codex/` etc. Don't invent cross-harness settings that don't exist.
- Project work and source-controlled deliverables belong in `projects/`. External Git repositories should normally live beside this repository.
- Do not commit tokens, auth state, machine-local overrides, caches, transient build outputs.
- Provisioning belongs in `setup`; its new changes must stay on `feat/add-agent-harness` until user-approved merge.
- Install Ubuntu **24.04 LTS alongside** existing 20.04. Prefer modern WSL DNS tunneling; preserve corporate network compatibility.
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
