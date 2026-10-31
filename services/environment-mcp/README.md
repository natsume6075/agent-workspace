# WSL environment MCP

通常のChatGPTからWSLのバージョンを読むための最小MCPサーバー。ハーネス固有の設定やSkillsを必要としない。Node.jsと標準MCPクライアントがあれば利用できる。Codex CLIは取得対象であり、サーバーの実行依存ではない。

## 再構成とローカル検証

このリポジトリをcloneし、Node.js 22以上（実測26.13.0）とnpmが使えるシェルで:

```bash
cd services/environment-mcp
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run verify
```

SDKはpackage.jsonとpackage-lock.jsonで固定する。既存のCodex設定、OSサービス、グローバルnpm環境は変更しない。通常のWSLシェルで実行する。エージェントのsandboxが子プロセスを制限する場合のEPERMは、MCP通信失敗と分けて扱う。

`npm run verify` は別プロセスの標準MCPクライアントからinitialize、tools/list、tools/callを行い、結果JSONを表示する。これはローカル検証でありChatGPT接続成功ではない。

## 公開機能

ツールは `get_environment_versions` の1つだけ。引数は `{}`（省略可）で、追加キーを拒否する。戻り値はtextのJSONと同一のstructuredContent。

| キー | 取得元 |
|---|---|
| os | 固定ファイル `/etc/os-release` のPRETTY_NAME |
| kernel | `uname -r` |
| node | サーバー実行中のNodeバイナリで `--version` |
| npm | `npm --version` |
| codex | `codex --version` |
| collected_at | 取得完了時点のUTC ISO日時 |

各項目は `{ "status": "ok", "version": "..." }`。取得できない場合はversionを付けず、`not_installed`（コマンドなし）、`timeout`、`error`、`unavailable`（OS情報なし）を返す。Nodeはサーバー実行に必須のため、起動できたサーバーでは存在する。

コマンドはコード内に固定。shellを使わず、並列実行、各5秒・出力4KiBまで、時間切れはSIGKILL。子プロセスに渡す環境変数はPATH/HOME/LANG/NO_COLORのみ。stderrや例外本文は返さない。サーバーのstdoutはMCPプロトコル専用。任意コマンド実行、ファイル検索・編集、エージェント起動のツールはない。

## Secure MCP Tunnel（第一候補）

公式資料（2026-10-31確認）:

- [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)
- [ChatGPTへの接続と検証](https://developers.openai.com/plugins/deploy/connect-chatgpt)

stdioサーバーなので、トンネルクライアントがサーバーを子プロセスとして起動する。WSL上に公開ポートやローカルHTTPポートを開けない。起動中のWSL、インターネット接続、外向きHTTPSが必要。

### 利用条件と認証操作

1. [Platform Tunnels](https://platform.openai.com/settings/organization/tunnels)で目的の組織を選択し、専用トンネルを作成する。作成にはTunnels Read + Manageが必要。
2. 利用するChatGPTのworkspaceをトンネルに関連付ける。個人アカウントでも対象組織・workspaceの対応を確認する。
3. Tunnels Read + Useを持つ実行用APIキーを正規画面で作る。管理用キーを常駐実行に使わない。ChatGPT契約とPlatform側の権限は別に確認する。
4. [ChatGPT Plugins](https://chatgpt.com/plugins)の追加メニューでAdd custom MCP server / Tunnelが使えることを確認する。

キーはチャット・コマンド引数・Git・ログ・設定ファイルに書かない。下記起動スクリプトの非表示入力欄に、WSLの端末で直接入力する。キーはその実行中のプロセス環境にのみ渡す。`set -x`、環境変数ダンプ、HTTP生ログを有効にしない。

### クライアント導入・起動・停止

```bash
python3 install-tunnel.py
./.local/bin/tunnel-client help quickstart
python3 tunnel.py
```

インストーラーは公式最新リリースを取得し、リリースのSHA-256と照合して `.local/bin/` にだけ配置する。実際の導入版は `.local/tunnel-release.json` に記録する。`.local/` はGit対象外。clone後は再導入する。サーバーソースとnpm依存はGit/lockfileが正本であり、トンネルクライアントは公式推奨に従い最新を選ぶ。

`tunnel.py` が非表示で求めるキーやトンネルIDは、ここに転記しない。起動後は同じターミナルを開いたままにする。停止はCtrl+C。再接続は同じコマンドで同じトンネルIDとキーを入力する。トンネルが同一なら通常はChatGPT側の再登録は不要。メタデータ変更後はChatGPT側でRefreshして新規会話で試す。

スクリプトは公式クライアントのdoctorを実行し、成功時にforegroundでrunする。設定は専用の `.local/tunnel-config.json` に生成し、キーの値ではなく環境変数参照だけを書く。MCP子プロセスへは実行用キーを渡さない。管理UI用のloopbackポートのみ動的に開く（MCP自体はstdio）。別のWSLターミナルで次を実行し、`/readyz` のHTTP 200を確認してから登録する。

```bash
cd services/environment-mcp
python3 tunnel.py --status
```

診断のみなら `python3 tunnel.py --doctor-only`。認証前のdoctor失敗と、起動後のready成功は区別する。起動・停止はsudo不要。PCのスリープやWSL終了中は利用できない。

## ChatGPTへの登録値

| 項目 | 値 |
|---|---|
| Name | WSL Environment |
| Description | Read OS, kernel, Node.js, npm and Codex CLI versions from my WSL. |
| Connection | Tunnel |
| Tunnel | Platformで作成したトンネルを選択、またはそのtunnel_id |
| MCPサーバー側の認証 | No authentication（サーバーにOAuthはなく、トンネルの組織/workspace権限で制限） |
| 公開URL | 不要 |
| 発見されるツール | get_environment_versions のみ |

トンネルクライアントが正常稼働中にCreate as a pluginを実行し、発見されたツールを確認する。実行用APIキーをChatGPTの登録欄に入れない。

## スマホでの往復検証

1. 登録したプラグインをインストール。同じアカウント・workspaceでスマホのChatGPTを開く。
2. 新しい通常の会話で `@` から **WSL Environment** を選択できるか確認。
3. 「get_environment_versionsを実行し、返されたJSONをそのまま表示して。取得できない値を推測で補わないで」と依頼する。
4. ツール実行結果にWSLカーネル、各バージョン、新しいcollected_atがあるか確認。ローカルverify結果とも比較する。別の呼び出しなのでcollected_atが一致する必要はない。
5. もう一度呼び出し、取得日時が更新されるか確認する。必要なら停止中の呼び出しが失敗し、再起動後に復帰することも確認する。
6. 登録・スマホ選択・実呼び出しの各結果をTASKS.mdへ別々に記録する。画面に返答が出るだけでなく、実際のツール呼び出しを確認する。

## 利用条件が合わない場合

- Tunnels権限不足: 組織管理者にRead/Use/Manageの必要な権限を確認。新しい権限の反映待ちも考慮。
- ChatGPTにトンネルが出ない: workspace関連付け、選択中アカウントと組織、Tunnels Read + Useを確認。
- カスタムMCP自体が使えない: 対象アカウント/プラン/workspaceポリシーで許可されるか確認。外部トンネルに変更してもこの制約は解決しない。
- カスタムMCPは使えるがSecure MCP Tunnelが使えない: 代替は認証付き公開HTTPSのStreamable HTTP `/mcp` エンドポイントとHTTPS転送サービス。現在のstdioサーバーにはHTTPアダプターが別途必要。この代替の公開・認証・運用はまだ実装/実行していない。localhostやTailscale内のURLだけを通常のChatGPTへ登録してもクラウドから到達できない。
- スマホでプラグインが見つからない: 同じworkspace・インストール・クライアントの対応状況を確認。PCで成功してもスマホで成功とは扱わない。

## 実施状況

実測と残作業は [TASKS.md](TASKS.md)。既存の公式Remote Controlとは独立した接続であり、エージェント実行機能は含めない。
