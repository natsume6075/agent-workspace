# ワークスペース共通タスク台帳

## 2026-11-01 ローカル成果物のPR化

- PR-01: DONE（提出まで、mergeは未実施）。[setup #8](https://github.com/natsume6075/setup/pull/8)にDocker/gh導入、[dotfiles #4](https://github.com/natsume6075/dotfiles/pull/4)にマシン固有Git設定分離、[agent-workspace #1 Draft](https://github.com/natsume6075/agent-workspace/pull/1)にMCP/remote-agent・読み取りルール・移設/整理記録を提出。binのマシン専用リンクはローカルexcludeで保持。モデルカタログ参照を `~/llm/adapters/codex/` へ修正。既存テスト3+14+1件成功。ChatGPT/スマホ/通常Codex quotaの残確認は未完のまま。次はPRレビューとDraftの残検証。

## 2026-11-01 関連6リポジトリのブランチ整理

- GIT-01: DONE。主ブランチ名を維持。dotfiles PR #3をmasterへmerge、ローカル同期。local-llmの退避ブランチをタグ保全して削除。ユーザーがgh導入/ログイン後、統合済みリモート11本をSHA/祖先関係再検証して削除し、6repoをfetch --prune。古い未統合3本はレビューで回帰/未完成部分を確認し保持。未コミット作業、setupの導入用ローカルfeature branch、ユーザーのgit認証設定変更を保持。古い3本の機能修正は別作業。[証跡と判断](BRANCH_CLEANUP_20261101.md)。

## 2026-11-01 ローカルLLM独立管理

- LLM-04: DONE。レシピを `~/llm/` へ移設。Ollama本体と `adapters/codex/` を分離し、`~/bin/codex-local{,-fast}` から任意の作業先で利用可能。既存モデルdigest一致、直接APIと/tmpからのCodex応答成功。旧ディレクトリは互換入口とローカル診断データを保持。正本は `~/llm/README.md` / `~/llm/RESULTS.md`（以下の過去のRESULTSリンクは移設前の場所）。[privateリポジトリ](https://github.com/natsume6075/local-llm)へ14ファイル登録。mainはローカル/リモートとも `b95761023505c9c35674f3b3a7069381e9de836e`、tree/SHA/実行権限一致、ローカルclean。モデル・秘密・生データは対象外。通常のgit通信認証は未設定のまま（今回はコネクタ経由）。

状態はリポジトリの事実に基づく。**GitHubでの作成とユーザーのPCでの成功は別**。詳細方針は [TASK_POLICY.md](TASK_POLICY.md)。

| ID | 状態 | Owner | 目的・完了条件 / 証跡 |
|---|---|---|---|
| BOOT-01 | DONE | agent | `setup` feature branch と Draft PRを準備。 [PR #2](https://github.com/natsume6075/setup/pull/2)。**mergeせず維持**。 |
| BOOT-02 | DONE | agent | 本リポジトリにルートAGENTS、Codexプロジェクト設定、ガバナンス、引き継ぎ、Gitignoreを配置（GitHub側）。 |
| ENV-01 | DONE | human | 2026-10-31: ユーザーがWSL設定完了と申告。現環境のUbuntu 26.04.1 / WSL2も確認済み。旧ディストリ削除等の個別操作ログは未採取。 |
| ENV-02 | TODO | joint | Ubuntu 26.04のDNS/apt通信を検証し、旧focalの名前解決エラーを新環境で再現しない。VPN/Proxy要件があれば `setup` 側へ記録。 |
| ENV-03 | TODO | joint | `setup/linux/setup.sh` の `AppsToSetup` から `agent-workspace` を選択し、clone・`agent-workspace/setup.sh` によるNode LTS・Codexの導入と再実行時の非破壊性を確認。Git cloneとcurl(APIから既定ブランチのtarball)の両方式を検証。26.04上でNeovim PPAなど既存のaptパッケージの対応も確認。 |
| ENV-04 | TODO | human | WSLのCodexで `codex login`、このworkspaceから `codex` の動作・AGENTS.mdの読み込みを実機確認。 |
| ENV-05 | DONE | agent | 2026-10-31: 新規セッションで `AGENTS.md` → `TASKS.md` / `HANDOFF.md` / `TASK_POLICY.md` を読み、設計文書・Git履歴・実行環境と照合して再開できた。ENV-01〜04の実機完了を意味しない。 |
| SYNC-01 | TODO | human | Koofr Windows公式デスクトップを導入・ログインし、同期フォルダを確認。 |
| SYNC-02 | TODO | joint | WSLからKoofrフォルダへアクセスし、成果物・Vaultのパスをドキュメント化。Git作業ツリーを同期しない。 |
| SYNC-03 | TODO | human | iPhone ObsidianにKoofr Sync導入、アプリパスワードを安全に設定。実際の双方向同期を検証。 |
| SYNC-04 | TODO | joint | Vault/成果物の履歴バックアップ・復旧と同期競合時対応を決め、復元テストする。 |
| CFG-01 | IN_PROGRESS | agent | 必要なSkills/MCP/個別アダプターを実際の要件と公式仕様に基づき追加し、未使用機能は増やさない。 |
| INT-01 | IN_PROGRESS | joint | Google（Drive/Gmail/Calendar）、Slack、LINE、GitHubのコネクタを用途別に選択、read-onlyから始め権限を検証。 |
| REM-01 | TODO | joint | WSLで起動したCodexをスマホからRemote Control可能か実機検証。不可ならTailscale/SSH/tmuxなどを比較。 |
| MCP-ENV-01 | IN_PROGRESS | joint | 通常のChatGPTから独立MCP接続でWSLバージョンを取得。2026-10-31: `services/environment-mcp` にツール1つのstdioサーバー、lockfile、テストと手順を追加。ローカルMCP一覧/呼び出しと3テスト成功。ユーザーはTunnel両画面が利用可能と確認。認証・ChatGPT登録・スマホ往復は未完。[詳細](../../services/environment-mcp/TASKS.md)。 |
| SERV-01 | TODO | agent | 自宅Linuxサーバー移行の要件・低消費電力構成・安全なリモート管理を検討。購入や移行は未承認。 |
| LLM-01 | DONE | joint | 2026-10-31: Docker/Ollama公式0.40.13/qwen3.5:4b導入、日本語生成・関数呼出・GPU全体配置、Codexの実シェル読み取りを検証。生成80.85tok/s（短文単発）。Codexは64K派生モデル＋ローカルカタログ＋起動時Apps読込み無効で接続。既存設定ハッシュ一致、承認/sandbox保全。複雑な作業品質・再起動・他機復元は未検証。[詳細・制約](../../projects/local-llm/RESULTS.md)。 |
| LLM-02 | DONE | agent | 2026-10-31: 総合診断で会話タイトル生成（thread_source=thread_title）の長大生成と並列1の待ち行列を主因と特定。14,260token生成に172.6秒、本来1.4秒の返答が約170秒待機。通常Codex exec APIは4,746入力token/8ツールでも2.25秒。GPU/文書量主因の説明を修正。改善設定の適用は未実施。[証跡](../../projects/local-llm/RESULTS.md)。 |
| LLM-03 | DONE | agent | 2026-10-31: 対話TUIでeffort=noneが本体/会話タイトル双方へ伝播し、本体2.385秒・タイトル2.587秒・起動込み4.313秒を実測。同一タイトル256token上限A/Bも実施。選択式codex-local-fast.shと再測定器を追加、実スクリプト日本語生成4.832秒・シェル読み取り成功。元設定/承認/sandbox保全。4Bの事実誤認と形式不一致は残る。[詳細](../../projects/local-llm/RESULTS.md)。 |
| CFG-READ-01 | DONE | agent | 2026-10-31: ユーザー依頼でworkspace限定`.codex/rules/read-only.rules`とAGENTS/SECURITYを追加更新。定型読み取り5ケースallow、書き込み/実行可能10ケースをauto-allowしないことをCLIで検証。workspace-write/on-request/グローバル設定を保全。次回trusted起動で読込み、現在セッションへの反映は未検証。 |
| MERGE-01 | BLOCKED | human | WSL導入と旧ディストリ削除・Linuxセットアップ動作と再実行の非破壊性を確認後、setup PR #2をレビューしてmasterへmerge。Koofrの同期テストはCodexへ引き継げる。 |

## 現在の優先順位（2026-10-31）

- セッション再開調査（2026-10-31）: ローカル履歴に「ローカルLLM方針を確認」`01a191a3-95f9-7db2-8a75-4544046f29b9` が残存。再開コマンドを案内。ユーザーによる再開成功は未確認。

ユーザーの指示によりWSL設定フェーズからハーネス・ナレッジ接続へ移行。`CFG-01` / `INT-01` を優先する。ENV-02〜04の個別検証記録は未完のまま残すが、今回の作業の前提条件にはしない。接続状況は [KNOWLEDGE.md](KNOWLEDGE.md) を参照。

## 初回Codexの優先順位（当初計画）

`ENV-01` → `ENV-02` → `ENV-03` → `ENV-04` → `ENV-05` → `SYNC-01` ... 。`SETUP`に関する変更は `feat/add-agent-harness` のみで行う。
