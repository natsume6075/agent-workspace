# Codex / ハンズオフ

## スタート

`AGENTS.md` と [TASKS.md](TASKS.md) を読み、最初の `TODO` を実行する。作業管理は [TASK_POLICY.md](TASK_POLICY.md)、構造は [ARCHITECTURE.md](ARCHITECTURE.md)、意思決定は [DECISIONS.md](DECISIONS.md) に従う。

**この文書は引き継ぎ専用の一時テキストではなく、以後のすべてのCodexセッションが再開できるよう維持する実行ログ入口。** 具体的なタスク状態の正本は `TASKS.md`。

## 2026-10-12 時点の事実

- GitHubの `natsume6075/setup` に `feat/add-agent-harness` を作成。Draft [PR #2](https://github.com/natsume6075/setup/pull/2) を開いている。**master未マージ**。
- PRレビューでセットアップ方式を既存方式に統一した。`setup/linux/setup.sh` の `AppsToSetup` に `agent-workspace` を追加。`agent-workspace/setup.sh` がNode LTS・Codexのインストールを担当し、独立した `setup-agent-harness.sh` は削除済み。
- `setup/win/README.md` はUbuntu 24.04の導入・旧Ubuntuディストリビューションの確認/必要時バックアップ/削除・DNS tunneling・Koofr Windows導線を最新手順として記載。ユーザーは旧Ubuntuを削除する方針に変更。
- 2026-10-12の追記レビュー対応: `setup/linux/setup.sh` のcurl取得はGitHub API経由の各リポジトリ既定ブランチtarballに変更し、`linux/README.md` に追加していた冗長な設計説明を削除。
- 本 `natsume6075/agent-workspace` はプロジェクトローカルの実行環境。 clone先のパスは任意。 `README.md` と `AGENTS.md` は直下、詳細は `.agents/docs/`、タスク成果物は `projects/`。
- **ユーザーのWindows/WSLで動作検証は未実施。** 以前Ubuntu 20.04のapt更新で `Temporary failure resolving 'archive.ubuntu.com'` が発生。旧ディストリは24.04の動作確認と必要データの退避確認を経て、ユーザーの意向に従い登録解除・削除する。
- Koofr Windows desktopとiPhoneのObsidian Koofr Syncを採用。設定・権限・往復同期は実機未完了。
- 外部サービス連携、リモート操作、自宅サーバー、ローカルLLMは将来フェーズ。インストール済みとみなさない。

## 最初のユーザー支援

1. [Windows導入ガイド](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/win/README.md) に沿ってUbuntu 24.04を導入・疎通検証・既定化し、旧WSL Ubuntuの登録名確認→必要ならエクスポート→`wsl --unregister`で旧ディストリを削除する。
2. 新Ubuntuで `getent hosts archive.ubuntu.com`、`sudo apt update` を確認。DNS tunneling・VPN・Proxyを原因別に切り分ける。
3. [Linux導入ガイド](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/linux/README.md) のセットアップ実行を補助。出力を検証。
4. `codex login` の後、クローン先で `codex` を起動することで、AGENTS/プロジェクト設定/タスク台帳読み込みを確認。
5. 実機の証跡を `TASKS.md` に記録し、次のステップを明確にする。

## 自律的に進めてよいもの

読み取り調査、文書/コードの小さな修正、ローカルテスト、差分レビュー、未完了タスクの更新。GitHub pushや公開リポジトリへの書き込み前には対象・ブランチを確認し、ユーザー承認が必要な変更と区別する。

## 承認が必要なもの

**Ubuntu旧ディストリ削除はユーザーの意向として合意済み**だが、実行は人間が登録名とバックアップ状況を確認してから行う。それ以外のWindows管理者操作、Koofr/ChatGPT/GitHubログイン、シークレットの発行・入力、外部サービス送信、権限緩和、費用発生、サーバー機器購入、ネットワーク公開、重要ファイルの削除、`setup/master`へのマージは事前確認。

## 次の一手

ユーザーがWindows PowerShellで `wsl --list --verbose` を確認し、24.04をまだ導入していなければ `wsl --install -d Ubuntu-24.04` を実施。次に `setup` 記載のCodex自動構築へ進む。**トラブルシュートが必要ならここに検証結果を追記する。**
