# agent-workspace

**エージェントが作業するための、Git管理可能で再現可能なプロジェクト全体。**
ハーネスの共通方針・設定・タスク・成果物を、このリポジトリ内だけに閉じる。別のディレクトリで起動するCodexには影響を与えない。

## 起動

clone先は任意です。上記は現在のディレクトリにcloneする例で、特定の絶対パスは要求しません。

WSL2 UbuntuにおけるOS・Node.js・Codexの導入は [setup](https://github.com/natsume6075/setup/tree/feat/add-agent-harness/linux) が担当する。

```bash
git clone https://github.com/natsume6075/agent-workspace.git
cd agent-workspace
codex
```

初回も再開時も、Codexはルートの `AGENTS.md` に従って `.agents/docs/TASKS.md` と `.agents/docs/HANDOFF.md` を確認する。追加のプロンプトファイルは不要。

## 構造

```text
agent-workspace/
├── README.md                  # 人間向けの入口
├── AGENTS.md                  # エージェント向け自動読み込み入口
├── .agents/
│   ├── docs/                  # アーキテクチャ・判断・タスク・引き継ぎ
│   └── skills/                # 複数ハーネス向けSkills
├── .codex/
│   └── config.toml            # このプロジェクトに限るCodex設定
├── projects/                  # 実際の作業・小さな成果物
└── .gitignore
```

- ルートには `README.md` と `AGENTS.md` を残す。詳細管理資料は `.agents/docs/` にまとめる。
- `.codex/config.toml` は信頼されたプロジェクトでのみCodexが読み込む。一部の認証・モデルプロバイダ設定はプロジェクト側で上書きできない。
- `projects/` にはテーマごとの実作業と成果物を置く。独立したGitリポジトリのcloneや巨大な生成物を無理に入れない。
- Git管理するのは**再現可能な指示・設定・ソース・小さい成果物**。認証・セッション・キャッシュ・ビルド結果は管理しない。
- KoofrはObsidian Vault・大きい成果物の同期に用い、Gitのワークツリー全体とは二重同期しない。
- サーバー移行、ローカルLLM、Google/Slack/LINE/MCP、remote-controlは引き継ぎタスクとして管理する。

## 運用ドキュメント

- [構成・境界](.agents/docs/ARCHITECTURE.md)
- [決定事項](.agents/docs/DECISIONS.md)
- [タスク管理ポリシー](.agents/docs/TASK_POLICY.md)
- [タスク台帳](.agents/docs/TASKS.md)
- [Codex向け引き継ぎ](.agents/docs/HANDOFF.md)
- [同期・バックアップ](.agents/docs/SYNC.md)
- [安全性](.agents/docs/SECURITY.md)
- [起動・トラブルシュート](.agents/docs/OPERATIONS.md)

## 関連

- [setup / feature branch](https://github.com/natsume6075/setup/tree/feat/add-agent-harness)
- [setup / Draft PR #2](https://github.com/natsume6075/setup/pull/2)
- [Codexプロジェクト設定](https://developers.openai.com/codex/config-reference/)
