# 同期・バックアップ方針

| データ | 同期・正本 | 補足 |
|---|---|---|
| AGENTS.md / Skills / 設定 / タスク / 小規模成果物 | Git (agent-workspace) | GitHubをリモートにして差分・履歴を管理 |
| OS/WSL/ツールの構築スクリプト | Git (setup) | `feat/add-agent-harness` で検証してからmerge |
| Obsidian Vault / 非Git成果物 | Koofr | Windowsデスクトップ同期。WSLからはWindows側の同期済みフォルダへアクセス |
| iPhone Obsidian Vault | Koofr Sync (community plugin) | iPhoneのObsidianローカルVaultとの双方向同期。アプリ起動・同期完了を確認 |
| 大規模生成物 / モデル重み | 適切なクラウドや別容量 | Gitや無料10GB枠には無理に詰めない |
| APIキー / OAuth / Codex認証 | OS認証/秘密管理 | どのGit・Koofrへも保存しない |
| セッション・キャッシュ・ビルド結果 | 各端末ローカル | バックアップ不要または別途判断 |

## Koofr導入

- Windows向けデスクトップ: [Koofr](https://koofr.eu/) 公式から取得、インストール・ログイン・同期パスを確認。
- WSLからのアクセス: `/mnt/c/Users/<Windowsユーザー>/...` の実際の同期フォルダを探す。WSL/Linux直下に同じ同期対象への別の同期クライアントを二重に起動しない。
- iPhone: Obsidianコミュニティプラグイン [Koofr Sync](https://github.com/bartekmp/koofr-obsidian-sync) を導入。Koofrの**アプリ専用パスワード**を使う（通常のKoofrログインパスワードを使い回さない）。
- テスト: PCで作成→Koofr同期→iPhone Obsidianで反映→iPhoneで編集→PCで反映。1つずつ同期完了を確認。競合時は即上書きせずバックアップを確認。
- 注意: iPhoneではObsidianが他社クラウドのフォルダを直接Vaultとして開けないため、Koofr Syncによる**アプリ内の同期**。閉じている間の常時同期は前提にしない。
- Koofr Syncは比較的新しい第三者製プラグイン。動作・保守・競合処理は実機で確認する。**自動同期＝バックアップではない**。

## バックアップ

別の場所に定期スナップショットを持ち、誤削除・同期の破損から復旧できるか確認。方法は `SYNC-04` にて決定する。バックアップ用の秘密情報をリポジトリに載せない。
