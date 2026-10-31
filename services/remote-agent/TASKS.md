# Remote agent tasks

| ID | 状態 | 完了条件・証跡 |
|---|---|---|
| REMOTE-01 | DONE | 2026-10-31: ChatGPTの判断でWSLの作業エージェントに委任する構想。作業ごとに通常Codex／ローカルLLMを選択する。 |
| REMOTE-02 | DONE | 2026-11-01: Codex app-server、sandbox=workspace-write、approval_policy=on-requestで実装。承認要求はMCP form elicitationで本人に提示。未対応クライアントでは保留。 |
| REMOTE-03 | DONE | 2026-11-01: 永続ジョブworker、重複防止、進捗、継続、中止、成果物snapshot、Unix socket mode 0600、再接続・失敗時no-retryを実装。npm test 14件、tunnel設定テスト1件成功。 |
| REMOTE-04 | IN_PROGRESS | ローカル版をMCP→worker→app-serverで実機検証: ファイル作成、同threadへの追加指示、成果物snapshotのハッシュ・内容一致が成功。通常Codexはこの最終構成の検証時にChatGPT利用上限で失敗。以前のworkerなし構成での成功は別証跡。ChatGPTへの切替は未実施。 |
| REMOTE-05 | TODO | ChatGPT側でtool refresh・本人承認form・通常/ローカル各backend・スマホでの依頼/継続/中止を実機確認。 |

## 次の手順

`README.md`を読み、1) `npm ci`、2) worker start、3) `python3 ../environment-mcp/tunnel.py --remote-agent`でMCP入口をforeground再接続、4) ChatGPTでRefreshしてツール一覧確認、5) まずlocal_codexで小さな/tmp作業を試す。失敗時は既存入口に戻す。詳細はREADME。

## 未解決

- `request_permissions`形式の追加ファイルシステム/ネットワーク権限要求は自動承認しない。承認確認を実装済みのcommandExecution/fileChange要求に限る。
- 通常Codex最終検証はquotaで未完。ChatGPT実接続・スマホ承認formも未確認。
- 共通HANDOFFにも本サービスの入口と残作業を記録。詳細の正本は本台帳とREADME。
