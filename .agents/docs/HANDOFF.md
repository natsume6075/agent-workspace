# Codex / ハンズオフ

## 2026-11-01 全PRマージ後の同期完了

- setup #8 / dotfiles #4 / agent-workspace #1はすべてmerge済み（API確認）。setup master `e31a955`、dotfiles master `37850c0`、workspace main `b8cfbfe`へローカルをfast-forwardした。
- 作業ブランチfeat/add-agent-harness / feat/local-git-config / feat/local-services-and-handoffはGitHub側で削除済み。ローカルでも削除し、追跡参照をprune。今後は主ブランチから必要な作業ブランチを作る。未統合nvim2本/bin1本は保持。
- 以下のPRレビュー待ち・Draftは提出時の履歴。次の機能作業はremote-agentのChatGPT/スマホformと通常Codex最終構成の実機確認。mergeは未検証項目の実機成功を意味しない。

## 2026-11-01 PR #1のLLM互換スクリプトを削除

- ユーザー指摘を受け、`projects/local-llm/codex-local.sh` と `codex-local-fast.sh` の互換ラッパーも削除。独立した `~/llm/` の本体とPATH登録済みの `~/bin` を使用する。workspace側には移設案内READMEとGit対象外の診断scratchだけを残す。
- remote-agentはすでに `~/llm/adapters/codex/codex-models.json` を直接参照しており、旧ラッパーに依存しない。以下の「旧入口を保持」は移設時の履歴で、現状の起動経路ではない。

## 2026-11-01 ローカル成果物をPR提出

- 提出完了: [setup #8](https://github.com/natsume6075/setup/pull/8)（feat/add-agent-harness → master）、[dotfiles #4](https://github.com/natsume6075/dotfiles/pull/4)（feat/local-git-config → master）、[agent-workspace #1 Draft](https://github.com/natsume6075/agent-workspace/pull/1)（feat/local-services-and-handoff → main）。PR-01 DONEは提出まで。今回mergeしていない。各作業ブランチをpushし、作業ツリーを整理済み。setupの2スクリプトもリモートに保存済みとなった。
- 次は上記PRのレビュー。workspace PRはremote-agentのChatGPT/スマホform・通常Codex最終構成が未検証のためDraft。認証情報、tunnel/.local、モデル・診断生データはGit対象外。既存の未統合nvim2本/bin1本は引き続き保持。

- ユーザーがローカル成果物のPR化まで明示依頼。setupはfeat/add-agent-harness、dotfilesはfeat/local-git-config、agent-workspaceはfeat/local-services-and-handoffへまとめる。
- remote-agentのカタログ参照にLLM移設後の追従漏れがあり、`~/llm/adapters/codex/codex-models.json`へ修正。environment-mcpとremote-agentの既存テスト3+14件、およびPythonのtunnel設定テスト1件成功。sandbox内の子プロセス制限で失敗後、通常WSL権限で成功した。通常Codex最終構成はquotaで未検証、ChatGPT実接続/スマホformは未確認のまま。
- dotfilesはghが追記したcredential helperをmode0600の `~/.config/git/local.inc` へ移し、共通.gitconfigからincludeする。移設前後でhelper値一致を確認。トークンは従来のgh認証保存先に残す。binの~/llm起動リンクは `.git/info/exclude` へ登録し、ローカルに保持。

## 2026-11-01 ブランチ整理完了

- 対象6repoと主ブランチ名維持はユーザー確認済み。dotfiles PR #3をmerge、master `81d11ef`へローカル同期。未統合nvim2本/bin1本はレビューで問題があり保持。未コミットデータも保持。
- local-llmの旧退避ブランチは `archive/local-initial-20261101` タグへ移し削除。setupの同一内容のローカルfeature branchを削除後、gh導入用に規定どおりfeat/add-agent-harnessを再作成。Docker/gh導入スクリプトは未コミット。
- ユーザーのgh導入/ログイン後、ネットワーク制限外でauth成功を確認。削除スクリプトのdry run → --applyでSHA不変/主ブランチ統合済みの11本を削除、6repoをfetch --prune。GIT-01 DONE。削除済みmanifestでの再実行は不要。詳細は [整理記録](BRANCH_CLEANUP_20261101.md)。
- gh auth setup-gitに伴うdotfiles `.gitconfig` のユーザー変更を保持し、commit/pushしていない。次に機能開発するなら、レビューで残したnvim2本/bin1本の回帰/未完成部分を個別に修正・検証する。setupのローカルfeature branchは未コミットの導入スクリプト2個の作業先として保持。

## 2026-11-01 ローカルLLMを独立管理へ移設

- 正本は `~/llm/`。Compose・models.lock・verify・資料はルート、Codex固有の設定/準備/測定は `adapters/codex/`。APIはCodexから独立したOllamaサービス。
- `~/bin` は既存binリポジトリへのsymlink。そこへ `~/llm/bin/codex-local` と `codex-local-fast` のリンクを設置（binリポジトリへcommit/pushしていない）。PATH/シェル設定を変更せず、呼び出し元の作業先を維持。旧 `projects/local-llm/` の起動スクリプトは互換ラッパー。生リクエスト等のscratchは旧場所にローカル保持し、移設先やGitHubに含めない。
- Compose名 `local-llm` とボリューム `local-llm_models` を維持。コンテナ操作・再取得は行わず、モデルdigest一致と直接APIのOK応答を確認。Codex設定2個のハッシュは今回の開始時と終了時で一致。承認/sandbox・sudoers・グループは変更なし。
- リモート完了: `natsume6075/local-llm` privateをAPIで確認し、コネクタでレシピ14ファイル登録。mainは `b95761023505c9c35674f3b3a7069381e9de836e`、tree `8b1696e04d5840cd2e180af3512aa17411d2f6b1`。リモート全blobのSHA/実行権限をローカルと照合。GitHub APIのcommit metadataからSHAが一致するGitオブジェクトを取り込み、ローカルmainとorigin/mainを同一履歴へ同期、元の初回コミットは `archive/local-initial` に保全。作業ツリーclean、LLM-04 DONE。
- WSLのGitHub認証は未設定のままなので、通常のgit fetch/pushには別途認証が必要。今回は認証済みコネクタで登録した。トークンや認証情報のコピー・グローバル設定の変更はしていない。次の作業は必要な別クライアントからのAPI利用。モデル復元・他機復元は未検証。

## 2026-10-31 Ctrl+C後のセッション調査

- 直前の会話候補「ローカルLLM方針を確認」の履歴ファイル残存を確認。ID: `01a191a3-95f9-7db2-8a75-4544046f29b9`。`codex resume <ID>`、一覧は`codex resume --all`。再開成功は未確認。既存作業・設定は変更していない。

## 2026-10-31 通常ChatGPTからWSLへのMCP検証

- ユーザーの明示依頼で `services/environment-mcp/` にハーネス非依存のstdio MCPサーバーを実装。get_environment_versionsの1ツールだけ。既存のCodex設定やローカルLLM作業は変更しない。
- SDK 1.32.2とlockfile、ローカル検証、運用・登録手順を配置。通常WSL権限で `npm test` 3件、`npm run verify`成功。sandbox内では子プロセス起動EPERM。スマホ往復はまだ未検証。
- 公式Secure MCP Tunnelが第一候補。ユーザーがPlatform TunnelsとChatGPT Add custom MCP server / Tunnelの両画面を利用可能と確認。認証済みブラウザ操作ツールはこの会話にないため、トンネル作成と実行用キーの取得・非表示入力はユーザー操作が必要。
- 詳細と次の一手は [environment-mcp TASKS](../../services/environment-mcp/TASKS.md) と [README](../../services/environment-mcp/README.md)。認証情報は文書・チャットへ残さない。ChatGPT登録・スマホ選択・スマホ呼び出しは個別に確認する。
- 公式tunnel-client v0.0.19をリリースSHA-256照合して専用.localに導入済み（Git対象外）。実CLIのquickstart/run/doctor/initヘルプを確認。`tunnel.py` は非表示キー入力→環境参照だけの専用設定→doctor→foreground run。`--status`でloopback /readyzを確認する。認証前doctorはキー未設定で想定どおり失敗。実トンネルへの接続はまだ行っていない。

## スタート

`AGENTS.md` と [TASKS.md](TASKS.md) を読み、最初の `TODO` を実行する。作業管理は [TASK_POLICY.md](TASK_POLICY.md)、構造は [ARCHITECTURE.md](ARCHITECTURE.md)、意思決定は [DECISIONS.md](DECISIONS.md) に従う。

**この文書は引き継ぎ専用の一時テキストではなく、以後のすべてのCodexセッションが再開できるよう維持する実行ログ入口。** 具体的なタスク状態の正本は `TASKS.md`。

## 2026-10-12 時点の事実

- GitHubの `natsume6075/setup` に `feat/add-agent-harness` を作成。Draft [PR #2](https://github.com/natsume6075/setup/pull/2) を開いている。**master未マージ**。
- PRレビューでセットアップ方式を既存方式に統一した。`setup/linux/setup.sh` の `AppsToSetup` に `agent-workspace` を追加。`agent-workspace/setup.sh` がNode LTS・Codexのインストールを担当し、独立した `setup-agent-harness.sh` は削除済み。
- `setup/win/README.md` はWSL 3.0系正式版とUbuntu 26.04 LTSの導入・旧Ubuntuディストリビューションの確認/必要時バックアップ/削除・DNS tunneling・Koofr Windows導線を最新手順として記載。ユーザーは旧Ubuntuを削除する方針に変更。
- 2026-10-12の追記レビュー対応: `setup/linux/setup.sh` のcurl取得はGitHub API経由の各リポジトリ既定ブランチtarballに変更し、`linux/README.md` に追加していた冗長な設計説明を削除。
- 本 `natsume6075/agent-workspace` はプロジェクトローカルの実行環境。 clone先のパスは任意。 `README.md` と `AGENTS.md` は直下、詳細は `.agents/docs/`、タスク成果物は `projects/`。
- **ユーザーのWindows/WSLで動作検証は未実施。** 以前Ubuntu 20.04のapt更新で `Temporary failure resolving 'archive.ubuntu.com'` が発生。旧ディストリは26.04の動作確認と必要データの退避確認を経て、ユーザーの意向に従い登録解除・削除する。
- Koofr Windows desktopとiPhoneのObsidian Koofr Syncを採用。設定・権限・往復同期は実機未完了。
- 外部サービス連携、リモート操作、自宅サーバー、ローカルLLMは将来フェーズ。インストール済みとみなさない。

## 最初のユーザー支援

1. [Windows導入ガイド](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/win/README.md) に沿ってWSL本体を正式版3.0系に更新しUbuntu 26.04を導入・疎通検証・既定化し、旧WSL Ubuntuの登録名確認→必要ならエクスポート→`wsl --unregister`で旧ディストリを削除する。
2. 新Ubuntuで `getent hosts archive.ubuntu.com`、`sudo apt update` を確認。DNS tunneling・VPN・Proxyを原因別に切り分ける。
3. [Linux導入ガイド](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/linux/README.md) のセットアップ実行を補助。出力を検証。
4. `codex login` の後、クローン先で `codex` を起動することで、AGENTS/プロジェクト設定/タスク台帳読み込みを確認。
5. 実機の証跡を `TASKS.md` に記録し、次のステップを明確にする。

## 自律的に進めてよいもの

読み取り調査、文書/コードの小さな修正、ローカルテスト、差分レビュー、未完了タスクの更新。GitHub pushや公開リポジトリへの書き込み前には対象・ブランチを確認し、ユーザー承認が必要な変更と区別する。

## 承認が必要なもの

**Ubuntu旧ディストリ削除はユーザーの意向として合意済み**だが、実行は人間が登録名とバックアップ状況を確認してから行う。それ以外のWindows管理者操作、Koofr/ChatGPT/GitHubログイン、シークレットの発行・入力、外部サービス送信、権限緩和、費用発生、サーバー機器購入、ネットワーク公開、重要ファイルの削除、`setup/master`へのマージは事前確認。

## 2026-10-31 キャッチアップ

- ローカルの `main` は `d725020`、開始時に未コミット変更なし。GitHubの最新状態やsetup PR #2の状態は未照会。
- 現在の実行環境は `/etc/os-release` が Ubuntu 26.04.1 LTS、`uname -r` が `6.18.54.1-microsoft-standard-WSL2`。新Ubuntuの利用は確認できるが、WSL本体バージョン・既定ディストリ・旧環境削除・apt通信・導入再実行の成否は未確認。ENV-01〜04は完了扱いにしない。
- 既存の引き継ぎ後のコミットでは、`setup.sh` にショートカット先の入力・物理パス解決・依存導入前のリンク検証・Codex導入検証・失敗ログ保存が追加済み。
- ENV-05は今回の文書からの再開で検証できたためDONE。次はユーザーの実施済み範囲と実機証跡を照合してENV-01〜04の台帳を更新する。

## 2026-10-31 ハーネス・ナレッジ接続へ移行

- ユーザーからWSL設定完了の申告。WSL構築の案内は繰り返さず、CFG-01 / INT-01を優先する。
- `codex --version`: `codex-cli 0.166.0`。`codex mcp list`: MCPサーバー未登録。両コマンドは成功したが、PATH aliases作成時にread-onlyの警告が出た。権限変更はしていない。
- `.codex/config.toml` はsandboxと承認設定のみ、`.agents/skills/` は説明READMEのみ。ワークスペース独自Skillは未作成。
- この会話ではGitHub / Gmail等のツールが公開されているが、アカウントへの読み取り成功・ローカルCLIでの利用は未検証。ツールの存在を接続成功と扱わない。
- 優先するナレッジの接続先はユーザーに確認中。Obsidian forgeはVault ZIPの生成用であり、既存Vault接続の代替として実行しない。

## 次の一手

ユーザーが優先するナレッジと対象範囲を確定し、[KNOWLEDGE.md](KNOWLEDGE.md) を更新する。ローカルVaultなら指定パスの存在・限定検索・出典付き回答を確認し、クラウドなら対象サービスの利用可能なツールと認証・権限を確認する。ハーネスは実際に必要な手順からSkills化する。

## 2026-10-31 ローカルLLM方針の再確認

- ユーザーからローカルLLM構築の意向と過去方針の照会。既存文書ではホスト型LLMから始め、Ollama/llama.cppを実現性検証後に導入する方針。評価対象はVRAM・コンテキスト長・速度・ツール呼び出し性能。
- 具体的なGPU・モデル・予算の決定はリポジトリ内で見つからなかった。LLM-01は未実施のためTODOを維持。
- ローカルLLMの次の一手は用途と既存PCのGPU/VRAM・RAMを確認し、現有機で試すか専用機を組むかを具体化すること。購入・インストール・モデルDLは実施していない。

## 2026-10-31 ローカルLLM導入調査・Docker方針相談

- `/mnt/c/Users/natsu/Documents/Codex/2026-10-13/new-chat/LOCAL_LLM_HANDOFF.md`を読み取り。ユーザーはOllama導入、4Bモデル実機確認、既存harness接続を依頼済み。既存設定・承認・sandbox保全、localhost限定、クラウド自動フォールバックなし。
- 実環境: Ubuntu 26.04.1/WSL2、RAM 7.6GiB（調査時available 6.4GiB）、ディスク空き953GiB。サンドボックス外の読み取り承認後にRTX 3070 8192MiB（調査時使用2500MiB）、systemdとユーザーsystemdのrunningを確認。sudoは対話認証が必要。Ollama/Dockerコマンド・docker.sockは見つからず、既定Windows導入パスにもDocker/Ollamaなし（全パスを探索したわけではない）。
- 公式インストーラーを`/tmp/ollama-install-reviewed.sh`へ取得し内容確認。公式Linuxアーカイブを`~/.local/ollama-linux-amd64.tar.zst`へ取得（約1.5GB）。展開・インストール・サービス登録・モデルDLは未実施。Windows NVIDIAドライバーは変更していない。
- `projects/local-llm/codex-local.sh`は未検証の起動スクリプト案。既存Codex設定を変更せず`--oss --local-provider ollama`で接続するもの。4096コンテキストはharness用途に不足する可能性があり、実測後に調整する。
- 既存設定SHA256: `~/.codex/config.toml` = `789e1e22cd9ba55bb7de124dc34cee1ae2257b42aac13ea9447f6f7c29bbbffc`、プロジェクト`.codex/config.toml` = `47fff698f83119d1ee46341f140e9f4295da3c6b5761e538a78864559beaf1e1`。既存設定は未変更。
- ユーザーがDocker前提だったかを確認し、再現性・移植・入れ替えを重視すると明言。直接導入を止めDocker Compose構成を推奨する段階。次はDocker方式を確定し、Engine/GPU toolkitの導入手順とCompose、永続volume、イメージ/モデルdigest記録を準備する。sudo認証はユーザーの操作が必要。モデル生成・GPUオフロード・Codex接続を実測するまで完了扱いにしない。

## 2026-10-31 Docker方式の導入

- ユーザーがDockerを選択し、直接導入用ファイルの削除も明示承認。`~/.local/ollama-linux-amd64.tar.zst`と`/tmp/ollama-install-reviewed.sh`を削除済み。バイナリ/サービスの直接導入は元々未実施。
- `/home/natsume6075/lib/setup`の開始時はcleanなmaster。ローカル`feat/add-agent-harness`を作り`linux/setup-local-llm-docker.sh`を配置（未commit/push/merge）。ユーザーがsudoで実行後、Docker 29.9.2/Compose 5.6.1/NVIDIA Toolkit 1.20.1とdocker activeを実測。
- Dockerソケットはroot:docker 0660。ユーザーはdockerグループ非所属のまま。`sudo -n`は対話認証を要求するため、管理コマンドはユーザーのWSLターミナルで実施。権限緩和はしていない。
- `projects/local-llm/compose.yaml`はOllama公式0.40.13をmanifest digest固定、GPU 1台、localhostのみ公開、クラウド無効、4096 context/並列1/同時ロード1、永続volume、ヘルスチェックとログ上限を設定。`docker compose config --quiet`成功。既存Codex設定2個のSHA256は前記と一致。
- `README.md`/`TASKS.md`/`verify.py`を配置。Python compileとshell構文チェック成功。実機推論とCodex接続は未検証。ユーザーにプロジェクトディレクトリで`sudo docker compose up -d --wait`と`sudo docker compose exec -T ollama ollama pull qwen3.5:4b`を依頼済み。完了後はlocalhost APIを確認して`verify.py`、GPU使用、Codex疎通へ進む。

## 2026-10-31 ローカルLLM実機検証完了

- ユーザーのsuccess申告後、localhost APIでOllama 0.40.13とqwen3.5:4b（4.2B/Q4_K_M、digestは`projects/local-llm/models.lock.json`）を確認。
- `verify.py`で日本語生成と関数呼び出し成功。初回ロード込み48.653秒、生成63token/80.85tok/s。4096 contextではsize=size_vram=3,140,495,604 bytes。
- Codex CLI 0.166.0は`--oss`だけでprovider不一致となり、起動時`model_provider="ollama"`も指定。公式Ollama連携ソースと同形式のカタログを明示しモデル情報警告を解消。
- 既存Appsツール一覧を全て読み込むと4K/32K/64Kで入力が圧迫されシェルツールを認識しなかった。ローカル起動だけ`features.apps=false`とすることで解決。`qwen3.5:4b-codex`は元の重みを共有する64K派生モデル。`prepare-codex-model.py`でdigest照合・再作成可能。通常のCodex設定は変更なし。
- 最終`codex-local.sh`からローカルCodexが`exec_command`でランダムな検証ファイルを実際に読み取り、コマンド出力が完全一致。最終回答に余分なツール出力情報を添えるケースがあり、厳密な出力形式や複雑な開発作業の品質は未評価。
- 64K時size=size_vram=5,216,676,084 bytes、GPU全体使用量約7.1〜7.3GiB。localhostの11434のみLISTEN確認、調査用中継11435は停止済み。既存設定2個のSHA256は導入前と一致。承認/sandbox・sudoers・グループ所属・Windows GPUドライバーは保全。
- 起動はworkspaceルートから`./projects/local-llm/codex-local.sh`。通常の`codex`は従来どおり。Docker管理は引き続き人間のsudo操作。停止・再開はプロジェクトREADME参照。
- LLM-01とLOCAL-01〜05は今回依頼範囲の実機検証完了としてDONE。詳細は`projects/local-llm/RESULTS.md`。次は実用途での品質評価、必要ならツール構成の選択、再起動とvolumeバックアップ/復元検証。未commit/push/merge。setup側の新規スクリプトもローカルfeature branchの未コミット状態。

## 2026-10-31 応答遅延調査

- ユーザーが応答の遅さとファン回転を報告。GPU配置は維持、GPU使用率82〜86%、全体VRAM約7.2GiB、温度64℃/消費電力198.21Wを実測。RAM available約4.6GiB/swap84KiBでスワップ主因の証拠なし。
- Codexモデルはthinking既定true。短文80.85tok/sはthink:falseの生成部分のみなので体感待ち時間の指標として不足。実セッションの数値ログに約1万tokenの入力と686〜792tokenの出力を確認。
- 複数のCodex API接続を確認。並列1のため順番待ちが起こり得る。調査側のthinking比較も待ち時間が混ざるため、自分のPythonプロセスだけをSIGINT停止（ユーザーのCodexやモデル設定は未変更）。時間比較の有効な数値はまだない。
- LLM-02で継続。次はユーザーの対話処理がない時に、load/prompt_eval/eval/queueを分離してthinking無効・小さいcontextの別プリセットを比較。長い入力/思考/待ち行列が有力だが、単一原因と確定しない。詳細はプロジェクトRESULTS.mdの追加調査。

## 2026-10-31 総合診断と読み取り承認の改善

- LLM-02は診断完了。遅延の主因はCodex対話TUIの会話タイトル生成。捕捉リクエストに`thread_source=thread_title`、36文字以下のタイトル指示、思考effort/出力上限未指定を確認。同じローカルモデルで1万token以上を生成し、並列1の本体返答を待たせていた。
- 元のログで14,260token/172.628秒と、本来1.393秒なのにHTTP全体約170秒の本体返答を対応確認。通常のCodex exec APIは入力4,746token/8ツールで2.25秒。64K・2,430token入力の直接APIは0.65秒、16Kは0.63秒。3070やworkspace文書量が主因という初期説明は修正。
- reasoning effort noneのResponses API検証は1.337秒、reasoning出力なし。ただしタイトル子セッションに一般のreasoning設定が引き継がれるかは未検証。起動設定はまだ変更していない。診断TUI/中継は終了、ユーザーの対話とOllamaは停止していない。
- 次は会話タイトル生成の思考無効/上限を検証して遅延を改善する。端末表示の`tui.terminal_title`を会話タイトル生成の無効化と混同しない。測定詳細は`projects/local-llm/RESULTS.md`の総合診断。捕捉リクエストはGit対象外scratchの0600ファイルにのみ保存。
- ユーザーが読み取り系の自動許可を明示依頼。workspace限定`.codex/rules/read-only.rules`でcat/ls/free/ps等と`systemctl --no-pager`の状態取得をallow。CLIで5許可/10非自動許可の15ケースを検証済み。Python/シェル全体、sudo/Docker全体、書込み可能オプションのあるrg/git/ss/GPUツールは一括許可しない。
- AGENTS.mdに読み取りはまずsandbox内で会話確認なく進める方針を記載。SECURITY.mdにスコープを記録。sandbox=workspace-write/approval_policy=on-requestとグローバル設定は未変更。ルールは次回trustedなworkspace起動で適用し、現在のセッションへの反映は未検証。sudo認証は別物。CFG-READ-01はルール実装とCLI検証完了としてDONE。

## 2026-10-31 LLM測定継続・高速起動を追加

- `model_reasoning_effort="none"`を起動引数で指定すると、対話TUI本体と`thread_title`の双方へeffort=noneが渡ることを実リクエストで確認。思考出力なし、本体2.385秒/5,649入力token/2出力token、タイトル2.587秒/158入力token/9出力token、起動込み両方完了4.313秒。
- 保存済みの同一タイトル用リクエストを256token上限で2回ずつ比較。既定thinkingは3.201/2.839秒・両方256token、noneは0.264/0.355秒・9/14token。上限なしの過去173秒とは別条件で、倍率の断定はしない。
- 選択式`projects/local-llm/codex-local-fast.sh`を追加。元の起動スクリプトを包みeffort=noneだけを指定。通常の起動・64K・Apps構成・既存設定2個・承認/sandboxを保全。両設定のSHA256は導入前と一致。高速モードの実スクリプトから日本語応答4.832秒、思考出力なしで終了。
- 思考なしのCodexで実シェル読み取りも成功。最終出力形式は不一致が残り、日本語説明にはColabをローカル実行の例にする等の事実誤認を観測。速度改善と品質を分ける。思考有無による品質差自体は未評価。
- 再測定器`projects/local-llm/measure-fast-tui.py`を追加。workspace直下から起動し、port11435を一時使用して最大35秒で診断用TUI/中継を終了。測定中は他の推論を止める。通常のユーザーCodex/Ollamaは停止しない。今回の診断プロセスは終了済み。
- LLM-03/LOCAL-06 DONE。起動は`./projects/local-llm/codex-local-fast.sh`。元の思考既定モードは`codex-local.sh`のまま残る。詳細・生データの場所はRESULTS.md/README参照。次は実用途の品質比較、必要なら高速モードの既定化を検討。変更は未commit/push。
