# Architecture

## Scope

`setup` provisions machines; `agent-workspace` defines **what the agent is**, **how it acts**, and **what it produces**.

```text
Windows workstation
├── WSL 3.0系（実行方式WSL2）/ Ubuntu 26.04 LTS
│   ├── Node LTS / Codex CLI (installed by agent-workspace/setup.sh)
│   └── <任意のclone先>/agent-workspace/ (this repo)
│       ├── README.md / AGENTS.md
│       ├── .agents/docs, .agents/skills
│       ├── .codex/config.toml
│       └── projects/
├── Koofr desktop sync (Windows)
│   └── local mirror: Obsidian Vault / shared artifacts
└── iPhone
    ├── Koofr app / Files: ordinary artifacts
    └── Obsidian + Koofr Sync: mobile-local Vault ↔ cloud
```

Git-managed code/agent metadata **is not the cloud-synced working tree**. WSL accesses the Windows Koofr mirror via `/mnt/c/Users/<user>/...` when required; detect real path first. This avoids putting `.git` database under bidirectional cloud sync.

## Layers

1. **Harness**: Codex first, optionally other harnesses; project-local entrypoints only.
2. **Shared instructions / skills**: root `AGENTS.md`, `.agents/skills/`, policy docs.
3. **Provider-specific adapters**: `.codex/` and other harness directories added when needed.
4. **Integration**: local filesystem for Obsidian; MCP/API for Google, Slack, GitHub, LINE (service-specific).
5. **Storage**: Git for configs and small project work; Koofr for notes/documents/artifacts; separate secret store; backups independent of sync.
6. **Execution location**: WSL first, later home Linux server.
7. **Model**: hosted LLM first, local LLM via Ollama/llama.cpp after feasibility testing.

## Directory responsibilities

- `README.md`: human entrypoint.
- `AGENTS.md`: auto-loaded narrow instruction entrypoint; longer docs only on demand.
- `.agents/docs/`: plans, decisions, project governance, durable task handoff.
- `.agents/skills/`: actual reusable Skills (not arbitrary prose copied into context).
- `.codex/config.toml`: minimal project-specific Codex config.
- `projects/<topic>/`: independently scoped work and small artifacts. Each substantive project can have a local task file, linked from `.agents/docs/TASKS.md`.
- `~/.codex`: authentication, session history and machine-specific settings. Do not commit this or symlink global instruction files.

## Execution / portability

Launching `codex` inside this repo loads the root instructions. Running it elsewhere should behave without workspace-specific policy. Project `.codex/config.toml` is loaded only for trusted projects; see [OpenAI config reference](https://developers.openai.com/codex/config-reference/). The aim is declarative reproducibility, not sharing mutable session state.
