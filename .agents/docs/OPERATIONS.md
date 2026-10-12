# 起動・運用・トラブルシュート

## 通常起動

```bash
cd ~/workspace/agent-workspace
git status --short --branch
codex
```

Codexは `AGENTS.md` → `.agents/docs/TASKS.md` → `.agents/docs/HANDOFF.md` を参照し、次の作業を特定する。

## 新規マシン

- [setup / Windows](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/win/README.md): Windows/WSL/Ubuntu 24.04、DNS、Koofr導入。
- [setup / Linux](https://github.com/natsume6075/setup/blob/feat/add-agent-harness/linux/README.md): Codex導入とclone、自動化スクリプト。
- [setup Draft PR #2](https://github.com/natsume6075/setup/pull/2) がマージされた場合、リンクをmasterへ変更する。

## WSL DNS

以前Ubuntu 20.04で `Temporary failure resolving 'archive.ubuntu.com'` が発生した。新Ubuntu側で:

```bash
cat /etc/os-release
getent hosts archive.ubuntu.com
curl -I https://github.com
sudo apt update
```

Windows PowerShell側: `wsl --version` / `wsl --list --verbose` / `wsl --update`。Microsoftの [WSLネットワーク](https://learn.microsoft.com/windows/wsl/networking) と [wsl-config](https://learn.microsoft.com/windows/wsl/wsl-config) を参照。DNS失敗・外向き通信失敗・企業プロキシ要求は別原因として調査する。

## 検証の記録

テスト日・コマンドの成否・再現条件・変更したファイル・コミットSHAだけを記録し、IP/トークン等の秘密情報は残さない。セッションを跨ぐときは `TASKS.md` と `HANDOFF.md` を更新する。
