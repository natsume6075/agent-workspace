# Environment MCP tasks

| ID | 状態 | Owner | 完了条件 / 証跡 |
|---|---|---|---|
| MCP-01 | DONE | agent | 2026-10-31: 独立したstdio MCPサーバーを実装。SDK 1.32.2をlockfileで固定。公開ツール1つ、引数拒否、出力schema、固定コマンド・各5秒の期限。 |
| MCP-02 | DONE | agent | 2026-10-31: `npm test` 3件成功。別MCPクライアントによるinitialize/list/call、未知ツール/追加引数拒否、コマンドなし、タイムアウトを検証。`npm run verify`でOS/カーネル/Node/npm/CodexとUTC日時取得成功。sandbox内の子プロセス起動はEPERMのため、承認された通常WSL権限で実施。 |
| MCP-03 | DONE | joint | Secure MCP Tunnelのクライアント準備と認証。公式v0.0.19 Linux amd64をリリースSHA-256照合後に.localへ導入し、quickstart/run/doctor/initの実CLIヘルプを確認。非表示入力のtunnel.py、環境参照設定、loopback ready確認を準備。ユーザーはPlatform TunnelsとChatGPT Add custom MCP server / Tunnelの両画面が利用可能と確認。2026-10-31: ユーザーがMCP稼働・HTTP 200を確認したと申告。エージェントによる再測定は未実施。 |
| MCP-04 | IN_PROGRESS | human | 2026-10-31: ユーザーがChatGPT接続成功を申告し、取得JSONを提示。登録・呼び出し成功。発見ツールが1つだけであることは未確認。 |
| MCP-05 | TODO | joint | 2026-10-31: スマホ検証の案内後にユーザーが取得JSONを提示。全5項目ok、collected_at=2026-10-31T12:22:50.648Z、バージョンはローカル測定と一致。使用端末の明示確認待ち。 |

## ローカル取得結果

`collected_at=2026-10-31T11:46:30.859Z`、Ubuntu 26.04.1 LTS、kernel `6.18.54.1-microsoft-standard-WSL2`、Node `v26.13.0`、npm `11.20.0`、Codex `codex-cli 0.166.0`。全項目status=ok。

## 次の一手

ChatGPT登録・JSON取得はユーザー提示結果で確認済み。使用端末がスマホだったか、発見ツールが1つだけかを確認する。手順はREADMEを参照。

認証前の `doctor --config .local/config-check.json --explain` はconfig_source/profile_loadがPASS、キー未設定がFAIL（想定どおりexit 2）。これは認証前の記録。現在の稼働状況は上記ユーザー申告を参照。

## 引き継ぎ（2026-10-31）

ChatGPT経由の取得成功。残りは上記2点の確認。共通TASKS/HANDOFFはread-onlyのため今回更新できず、この記録を最新の証跡とする。
