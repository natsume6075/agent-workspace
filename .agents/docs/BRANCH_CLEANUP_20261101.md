# 2026-11-01 ブランチ整理

対象はユーザー確認済みの agent-workspace / setup / dotfiles / nvim / bin / local-llm。master/mainの名前は維持する。

## 実施済み

- dotfiles PR #3を差分レビューし、Python/TOML/shell構文とdiffチェック成功、レビュー指摘・CIなしを確認。head `fdad0db93d0726ef74e81a93681e695f28181f7b` を指定してmerge。master `81d11ef1f63fd82a315ff0df141f86a4f0f09a02`、ローカルもfast-forward。herdr/terminal-browserでのGUI実機動作は今回未検証。setup.shは実行していない。
- setupのローカルfeat/add-agent-harness（masterと同じコミット）を削除。未コミットのDocker導入スクリプトのSHA256が変わっていないことを確認。その後、ユーザーがGitHub CLI導入を選択したため、規定どおり同名feature branchをmasterから再作成し `linux/setup-github-cli.sh` を配置。現時点で両導入スクリプトは未コミット。
- local-llmのarchive/local-initialはmainとの差分がTASKS.mdの旧pending状態だけであることを確認。`archive/local-initial-20261101` タグに保全し、ブランチを削除。
- agent-workspaceの既存変更、binのローカル起動リンクを保持。未コミット作業は今回のブランチ整理で公開・統合していない。

## 未統合3本のレビュー

ユーザーはレビューして可能なら統合を希望。以下は回帰・未完成部分があるため保持する。

| repo / branch | 判断の根拠 |
|---|---|
| nvim / adapt2toml | 11固有コミット。既存plugins/*.vimの一括読み込みを止め、プラグイン多数を無効化する。appearanceのguardがg:color_name、参照がg:colors_nameと不一致。起動時エラーのTODOも残る。現在masterのdein互換対策を含めて設計・検証が必要。 |
| nvim / tryToMergeToDotfiles | 2固有コミット。全体をnvim/へ移し、setup.shがルートから消える。現在の外部setup呼び出しとの整合を確認する移行作業が必要。 |
| bin / feature/add_adballlog | 8固有コミット。scratchの日付コマンドがdateと引数の間の空白を失う。myadbのデバイス選択が未完成。adb_alllogもpcap破損のTODOあり。単純統合で既存動作を壊す。 |

## リモート削除完了

統合済み11本の名前と調査時SHAは `scripts/merged-branches-20261101.json`。
setup 7本、dotfiles 2本（今回mergeしたPR分を含む）、nvim 2本。
GitHubコネクタにはbranch削除機能がなく、git pushは未認証で失敗（削除なし）。

ユーザーにWSLで以下を実行してログイン完了を知らせるよう依頼済み。

```bash
sudo bash ~/lib/setup/linux/setup-github-cli.sh
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
```

ユーザーがCLI導入とログインを実施。ネットワーク制限外の `gh auth status` でnatsume6075認証成功を確認（sandbox内では通信制限がinvalid tokenと表示されたため、再ログインは依頼していない）。
`python3 scripts/cleanup-merged-branches.py` のdry runで11本すべてSHA不変・主ブランチ統合済みを再確認し、`--apply` で全11本のDELETE成功を確認。
対象6repoのfetch --pruneを実施。スナップショットの11本は削除済みのため、同じmanifestでの再実行は不要。

リモート残ブランチはsetup=master、dotfiles=master、nvim=master/adapt2toml/tryToMergeToDotfiles、bin=master/feature/add_adballlog、agent-workspace=main、local-llm=main。
未統合3本・未コミット作業は保持。gh auth setup-gitによりdotfiles管理下の `.gitconfig` にユーザーの変更が生じたが、今回の整理でcommit/pushしていない。
