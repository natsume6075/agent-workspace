# Agent Workspace

このリポジトリは自己完結したエージェントの実行ワークスペース。**このリポジトリ外へ共通設定を強制適用しない**。

- 人間向けの概要は `README.md`、詳細なポリシーは `.agents/docs/`。
- **新規セッション開始時**: `.agents/docs/TASKS.md` と `.agents/docs/HANDOFF.md` を読み、未完了・ブロッカー・次の手順を確認する。タスク管理は `.agents/docs/TASK_POLICY.md` に従う。
- OS/WSL、外部リポジトリの取得、Koofrの人間向け導入手順は `natsume6075/setup`。Codexの依存関係・インストールはこのリポジトリの `setup.sh`。`setup` の新規変更は `feat/add-agent-harness` でレビューし、既存動作を壊さない。
- このリポジトリにはプロジェクト固有の指示・Skills・Codex等の設定、計画、進捗、Gitで扱う成果物を置く。
- 共通Skillsは `.agents/skills/`、Codex固有設定は `.codex/`。他のハーネス固有設定は必要になってから追加する。架空の設定や未検証の機能に依存しない。
- Git操作前にブランチ、差分、未コミット変更を確認する。人の既存データを上書きしない。小さくテスト可能な差分を優先する。
- 読み取り調査・状態確認は事前の会話確認なしで進め、まず既存sandbox内で実行する。定型の読み取りコマンドは `.codex/rules/read-only.rules` で自動許可する。汎用シェル・Python・sudo等を一括許可せず、OS認証や適用中ポリシーで必要な承認は維持する。
- 外部サービスへの書き込み、破壊的操作、権限緩和、公開設定、秘密情報の取扱いは事前に確認する。
- セッション終了前に `.agents/docs/TASKS.md` の状態と証跡、`.agents/docs/HANDOFF.md` の次の一手を更新する。未実機検証を完了と書かない。
