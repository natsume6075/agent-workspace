# agent-workspace

AI エージェントの稼働環境・共通設定・設計メモを管理するリポジトリ。

- 環境構築（OS / WSL / ツール導入）は [setup](https://github.com/natsume6075/setup) が担当。
- このリポジトリは **WSL 側の Linux ファイルシステム**（例: `~/workspace/agent-workspace`）に clone する。
- Codex をこのディレクトリから起動すると、`AGENTS.md` に記載された方針で作業できる。
- Koofr は Markdown Vault や共有成果物の同期に使う。Git ワークツリー・`.git`・認証情報は同期しない。

## 起動

```bash
cd ~/workspace/agent-workspace
codex
```

最初に `AGENTS.md` と `docs/HANDOFF.md` を読むこと。

## 関連リポジトリ

- [setup](https://github.com/natsume6075/setup) — WSL・Codex のインストール、Koofr 導入案内
