# Codex / ハンズオフ

## スタート

`AGENTS.md` と [TASKS.md](TASKS.md) を読み、最初の `TODO` を実行する。作業管理は [TASK_POLICY.md](TASK_POLICY.md)、構造は [ARCHITECTURE.md](ARCHITECTURE.md)、意思決定は [DECISIONS.md](DECISIONS.md) に従う。

**この文書は引き継ぎ専用の一時テキストではなく、以後のすべてのCodexセッションが再開できるよう維持する実行ログ入口。** 具体的なタスク状態の正本は `TASKS.md`。

## 2026-10-12 時点の事実

- GitHubの `natsume6075/setup` に `feat/add-agent-harness` を作成。Draft [PR #2](https://github.com/natsume6075/setup/pull/2) を開いている。**master未マージ**。
- `setup/linux/setup-agent-harness.sh` は既存の `linux/setup.sh` と分離し、WSLでのNode LTS・Codex・workspace cloneを担当する。
- `setup/win/README.md` はUbuntu 24.04の併設・DNS tunneling・Koofr Windows導線を追記。
- 本 `natsume6075/agent-workspace` はプロジェクトローカルの実行環境。 clone先のパスは任意。 `README.md` と `AGENTS.md` は直下、詳細は `.agents/docs/`、タスク成果物は `projects/`。
- **ユーザーのWindows/WSLで動作検証は未実施。** 以前Ubuntu 20.04のapt更新で `Temporary failure resolving 'archive.ubuntu.com'` が発生。新ディストリ導入前に旧環境を破壊してはいけない。
- Koofr Windows desktopとiPhoneのObsidian Koofr Syncを採用。設定・権限・往復同期は実機未完了。
- 外部サービス連携、リモート操作、自宅サーバー、ローカルLLMは将来フェーズ。インストール済みとみなさない。

## 最初のユーザー支援

1. [Windows導入ガイド](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/win/README.md) のUbuntu 24.04手順と、新旧WSL一覧をユーザーが確認できるように案内。
2. 新Ubuntuで `getent hosts archive.ubuntu.com`、`sudo apt update` を確認。DNS tunneling・VPN・Proxyを原因別に切り分ける。
3. [Linux導入ガイド](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/linux/README.md) のセットアップ実行を補助。出力を検証。
4. `codex login` の後、クローン先で `codex` を起動することで、AGENTS/プロジェクト設定/タスク台帳読み込みを確認。
5. 実機の証跡を `TASKS.md` に記録し、次のステップを明確にする。

## 自律的に進めてよいもの

読み取り調査、文書/コードの小さな修正、ローカルテスト、差分レビュー、未完了タスクの更新。GitHub pushや公開リポジトリへの書き込み前には対象・ブランチを確認し、ユーザー承認が必要な変更と区別する。

## 承認が必要なもの

既存Ubuntuの削除、Windows管理者操作、Koofr/ChatGPT/GitHubログイン、シークレットの発行・入力、外部サービス送信、権限緩和、費用発生、サーバー機器購入、ネットワーク公開、重要ファイルの削除、`setup/master`へのマージ。

## 次の一手

ユーザーがWindows PowerShellで `wsl --list --verbose` を確認し、24.04をまだ導入していなければ `wsl --install -d Ubuntu-24.04` を実施。次に `setup` 記載のCodex自動構築へ進む。**トラブルシュートが必要ならここに検証結果を追記する。**
