# ChatGPT → WSL Remote Agent

ChatGPTから自然文でWSLのCodexへ作業を委任するMCPサービス。通常CodexとローカルOllama版を依頼ごとに選べる。使える機能は環境確認、作業の受付、進捗、続きの指示、中止、成果物の取得、Codexが要求する操作の人間承認。

作業はPC/WSLが起動中だけ動く。既定の作業領域はこのGit workspace。1件ずつ実行し、実行時間上限は15分。ChatGPTは完了まで自動で待たないため、`job_id`を使って状況を照会する。

ローカルbackendは独立リポジトリ `~/llm/` のOllamaを使用する。Codex用カタログは `~/llm/adapters/codex/codex-models.json` を参照するため、先に [local-llm](https://github.com/natsume6075/local-llm) を配置し、モデルを準備する。

## 1回限りの準備

WSLターミナルで:

```bash
cd /home/natsume6075/lib/agent-workspace/services/remote-agent
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

失敗したら次へ進まず、出力を確認する。テストは14件。現在のCodex実装は0.166.0で検証した。

## 起動

まずworkerを開始する。ジョブはトンネル接続の切断後もworkerが保持する。

```bash
cd /home/natsume6075/lib/agent-workspace
node services/remote-agent/control.mjs start
node services/remote-agent/control.mjs status
```

statusに `pid` が出ればworker稼働中。出なければそこで止め、`services/remote-agent/.local/worker.log` を見る。

## ChatGPT側をremote agentモードへ切替

**ここで既存のバージョン取得専用接続から、ファイル作業ができる接続に切り替わる。** Secure MCP Tunnelはforegroundで動くため、現在のトンネル端末で `Ctrl+C` を押して停止する。これは接続を切るだけで、Platformのトンネルやキーを削除しない。

新たにWSLターミナルを開き:

```bash
cd /home/natsume6075/lib/agent-workspace/services/environment-mcp
python3 tunnel.py --remote-agent
```

前と同じ `tunnel_id` と実行用APIキーをそれぞれ入力する。キーはチャットやコマンド引数に貼らない。doctor成功後、トンネルがforegroundで動き続ける。別ターミナルで次がHTTP 200になることを確認する:

```bash
cd /home/natsume6075/lib/agent-workspace/services/environment-mcp
python3 tunnel.py --status
```

`--remote-agent`なしの通常起動は旧バージョン取得MCP。2つを同時に同じトンネルIDで起動しない。

ChatGPTの **Plugins** を開いて同じ **WSL Environment** pluginを **Refresh** する。Tunnel、Name、認証は変えず、同じトンネルを使う。ツールが8個になったことを確認する:

`get_environment_versions`, `get_agent_capabilities`, `submit_agent_task`, `get_agent_task`, `continue_agent_task`, `cancel_agent_task`, `resolve_agent_approval`, `get_agent_artifact`。

8個揃わない時は利用を始めず、worker statusとトンネルforeground logを調べる。旧入口へ戻す場合はCtrl+Cでremote-agent tunnelを止め、同じスクリプトを `python3 tunnel.py` で起動して、ChatGPTでRefreshする。

## 最初の試用

新しいChatGPT会話でpluginを選び、まずこの依頼をする:

> `get_agent_capabilities` を呼び、workerがreadyか、利用可能なbackendを確認して。続けて `local_codex` を使い、専用の一時作業ディレクトリを作って、その中に短いテキストファイルを作成・読み取りして。依頼の前に作業内容を説明して。

最初はローカル版を推奨。能力確認の結果で `local_codex.ready_for_submission` がtrueであることを確認する。依頼後は返された `job_id` で `get_agent_task` を呼ぶ。`completed`だけを成功根拠にせず、回答・検証結果・`changed_files`・artifactを確認する。続ける場合は `continue_agent_task`、止める場合は `cancel_agent_task`。

成果物の中身は返されたartifact IDで `get_agent_artifact` から取得する。snapshotは通常ファイルで32 KiBまで。secret名、`.git`、`.codex`、`.ssh`、`.aws`、`.local`、依存cacheなどのパスは除外する。スキャン上限は10000エントリ/作業、snapshotは最大32ファイル。

## 権限と承認

作業はこのworkspaceの `workspace-write` sandbox、`on-request`承認で実行する。任意のOSコマンド入力欄は作っていない。backendは明示選択制で、ローカルLLM失敗時にクラウドへ自動切替しない。各実行の時間上限15分、同時実行1件。

`awaiting_approval`になったら、`resolve_agent_approval`がMCPの確認フォームで実際のcommandまたはfile changeを提示する。人が明示承認するまで権限を渡さない。確認form非対応のクライアントでは保留になる。`request_permissions`型で追加workspaceやnetwork権限を求められた場合は本実装では拒否/保留する。

## 停止・再起動・障害復旧

トンネル停止: tunnelを起動した端末でCtrl+C。workerとジョブは残る。

workerを停止する:

```bash
cd /home/natsume6075/lib/agent-workspace
node services/remote-agent/control.mjs stop
```

workerの通常停止は実行中jobを`interrupted`に記録し、再起動時に自動でやり直さない。続きを試す時はChatGPTから明示的に依頼する。

強制終了後に再起動できずstale lockが報告された時だけ、まずプロセスを調べる:

```bash
node services/remote-agent/control.mjs status
ps -fp <報告されたPID>
```

ownerとagentのプロセスがどちらも存在しないと人が確認できた場合だけ:

```bash
node services/remote-agent/recover.mjs
node services/remote-agent/control.mjs start
```

生きたPIDが1つでもあればrecoverしない。判断がつかなければ停止して相談する。ジョブデータは `services/remote-agent/.local/jobs/` にmode 0600、workerのソケットはmode 0600。`.local/`はGitに含めない。

## 検証状況

- 14件の自動テスト成功。stdio、worker切断/再接続、承認、snapshot、private path除外を検証。
- `local_codex`: MCP→worker→app-serverで2段階の作業、同thread継続、artifact取得が成功。2026-10-31の実測記録は `.local/verification-local_codex.json`。
- `codex`: 同じ構成の最終検証は利用上限で失敗。通常Codex/HTTP MCP ChatGPT接続/スマホのconfirmation formは未確認。これは完了扱いにしない。

詳しい状態は [TASKS.md](TASKS.md)、全体設計は [DESIGN.md](DESIGN.md)。
