# ChatGPTからWSLエージェントへの作業委任

## 目的と現在地

通常のChatGPTがユーザーの依頼を判断し、WSL内のエージェントへ自然言語で作業を委任し、進捗・結果・成果物を取得する。定型のバージョン取得や文書検索だけに限定しない。

2026-10-31: environment-mcp経由のJSON取得成功をユーザー提示結果で確認。今回のリモート作業実行機能は未実装・未公開。既存の環境確認MCPは稼働したまま変更しない。

ユーザー選択: 作業ごとに通常のCodexとローカルLLM版Codexを選べること。

## 構成

ChatGPT → Secure MCP Tunnel → 作業受付・ジョブ管理 → Codexアダプター → WSLの作業ファイル。

ChatGPTは作業内容と実行先を決め、WSL側エージェントは調査・編集・テストなどの具体的手順を決める。依頼は自然言語。ツールごとに個別作業をハードコードしない。初期の作業対象はこのworkspaceとし、追加の作業ルートはホスト側で登録する。依頼文から任意の作業パスや権限設定を受け付けない。

## MCP契約案

- get_agent_capabilities(): 利用可能なbackend・workspace・制約を返す。モデル停止や認証エラーを利用可能と報告しない。
- submit_agent_task(request_id, instruction, backend, workspace): backendはcodexまたはlocal_codex。同じrequest_idの再送は同じjob_idを返す。異なる内容でのID再利用は拒否する。
- get_agent_task(job_id, cursor): 状態、進捗、最終回答、成果物の参照、実行したbackend、エラーを返す。ログ全量の自動転送はしない。
- cancel_agent_task(job_id): 受付後の作業を中止。プロセス停止の確認までcancelledとしない。既存のファイル変更はロールバックしない。
- continue_agent_task(job_id, request_id, instruction): 同一backend・同一workspaceの保存済みthreadに追記。別の最新threadを暗黙に選ばない。

開始・続行は短時間でjob_idを返す。長い処理の完了をMCP応答内で待たない。ChatGPTが結果照会する方式を初期実装とする。自動通知、ChatGPT会話のバックグラウンド継続・自動再開は別途クライアント対応の検証が必要。

## エージェント接続

Codex app-serverのstdio JSON-RPCを優先。thread/start、turn/start、turn/completed等で実行・追跡する。理由は承認要求をクライアントへ明示的に返せるため。codex execは単純な一括実行に使えるが、承認待ちの往復を含む本要件ではapp-serverを先に検証する。

通常版は既存の認証・モデル設定を利用。ローカル版は既存codex-local.shにあるOllama接続設定を再利用するアダプターとし、対話CLIの引数をapp-serverへ無検証で流用しない。クラウドへの自動フォールバックは行わない。

各jobにプロンプト・backend・workspace・thread_id・状態・結果をローカル永続保存する。秘密情報を含み得るため実行データはGit対象外、ファイル権限を制限。プロセス再起動時には実行中ジョブをinterruptedとして記録し、勝手に再実行しない。初期は同時実行1件で作業ツリーへの競合を防ぐ。

## 状態と承認

queued → running → completed / failed / cancelled / interrupted。
実行中の承認要求はawaiting_approvalとして別に保持する。承認対象の操作内容、ジョブ、要求IDに結び付ける。ChatGPT自身の判断を人間の承認として扱わない。ChatGPTでの明示承認をapp-serverのapproval応答へ安全に結び付けるUI/通信方式は、公開前の必須検証項目。未対応なら該当操作を保留または拒否し、成功扱いにしない。

既存workspace-write / on-requestを保全する。ユーザーの「任意の作業」は自然言語の幅を意味し、無制限のOS権限を意味するとは解釈しない。外部書き込み・破壊的操作・権限変更等の既存承認方針は継続する。

トンネル用キーを実行エージェントの環境変数へ継承しない。秘密情報を成果物・ログから自動送信しない。既存AGENTS.mdを読み、信頼できない取得文書を権限変更の指示として扱わない。

## 実装・検証順序

1. app-serverと両backendの初期化、thread保存、承認要求の往復方式をローカルで検証する。
2. ジョブ永続化、再送の重複防止、タイムアウト、中止、再起動時の状態を実装・テストする。
3. 上記MCP契約を別の入口に実装し、既存のバージョン確認ツールを維持する。
4. 通常版・ローカル版それぞれで、限定した作業領域の読み取り、ファイル作成、テスト、継続、中止、承認待ちを実機確認する。
5. ユーザーが実行機能を確認後、トンネルの実行先を切り替えChatGPTでツールをRefreshする。これはリモートからファイル編集等を可能にする有効化の段階。
6. スマホから自然言語で依頼→job_id→結果→成果物の一致を確認する。未検証の機能をDONEにしない。

## 公式資料（2026-10-31確認）

- https://learn.chatgpt.com/docs/app-server
- https://learn.chatgpt.com/docs/non-interactive-mode
- https://developers.openai.com/plugins/deploy/connect-chatgpt
