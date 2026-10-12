# ワークスペース共通タスク台帳

状態はリポジトリの事実に基づく。**GitHubでの作成とユーザーのPCでの成功は別**。詳細方針は [TASK_POLICY.md](TASK_POLICY.md)。

| ID | 状態 | Owner | 目的・完了条件 / 証跡 |
|---|---|---|---|
| BOOT-01 | DONE | agent | `setup` feature branch と Draft PRを準備。 [PR #2](https://github.com/natsume6075/setup/pull/2)。**mergeせず維持**。 |
| BOOT-02 | DONE | agent | 本リポジトリにルートAGENTS、Codexプロジェクト設定、ガバナンス、引き継ぎ、Gitignoreを配置（GitHub側）。 |
| ENV-01 | TODO | human | WindowsでWSL更新し、Ubuntu 24.04 LTSを別ディストリで導入。20.04は保全。 [setup手順](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/win/README.md)。 |
| ENV-02 | TODO | joint | Ubuntu 24.04のDNS/apt通信を検証し、旧focalの名前解決エラーを新環境で再現しない。VPN/Proxy要件があれば `setup` 側へ記録。 |
| ENV-03 | TODO | joint | `setup/linux/setup.sh` の `AppsToSetup` から `agent-workspace` を選択し、clone・`agent-workspace/setup.sh` によるNode LTS・Codexの導入と再実行時の非破壊性を確認。Git cloneとcurl(APIから既定ブランチのtarball)の両方式を検証。 |
| ENV-04 | TODO | human | WSLのCodexで `codex login`、このworkspaceから `codex` の動作・AGENTS.mdの読み込みを実機確認。 |
| ENV-05 | TODO | agent | 新規セッションが `TASKS.md` と `HANDOFF.md` から問題なくタスク再開できることを試験。 |
| SYNC-01 | TODO | human | Koofr Windows公式デスクトップを導入・ログインし、同期フォルダを確認。 |
| SYNC-02 | TODO | joint | WSLからKoofrフォルダへアクセスし、成果物・Vaultのパスをドキュメント化。Git作業ツリーを同期しない。 |
| SYNC-03 | TODO | human | iPhone ObsidianにKoofr Sync導入、アプリパスワードを安全に設定。実際の双方向同期を検証。 |
| SYNC-04 | TODO | joint | Vault/成果物の履歴バックアップ・復旧と同期競合時対応を決め、復元テストする。 |
| CFG-01 | TODO | agent | 必要なSkills/MCP/個別アダプターを実際の要件と公式仕様に基づき追加し、未使用機能は増やさない。 |
| INT-01 | TODO | joint | Google（Drive/Gmail/Calendar）、Slack、LINE、GitHubのコネクタを用途別に選択、read-onlyから始め権限を検証。 |
| REM-01 | TODO | joint | WSLで起動したCodexをスマホからRemote Control可能か実機検証。不可ならTailscale/SSH/tmuxなどを比較。 |
| SERV-01 | TODO | agent | 自宅Linuxサーバー移行の要件・低消費電力構成・安全なリモート管理を検討。購入や移行は未承認。 |
| LLM-01 | TODO | agent | Ollama/llama.cppによるローカルLLM検証とVRAM・コンテキスト長・ツール呼び出し性能を評価。購入やモデルDLは未承認。 |
| MERGE-01 | BLOCKED | human | WSLインストール・冪等性・Koofr導線の動作検証後、setup PR #2をレビューしてmasterへmerge。 |

## 初回Codexの優先順位

`ENV-01` → `ENV-02` → `ENV-03` → `ENV-04` → `ENV-05` → `SYNC-01` ... 。`SETUP`に関する変更は `feat/add-agent-harness` のみで行う。
