# ローカルLLMは独立リポジトリへ移設済み

- 正本: `~/llm/`
- リモート: https://github.com/natsume6075/local-llm （private）
- 推論サービス: Docker内のOllama。Codexを必要とせず、`http://127.0.0.1:11434` から利用できる。
- Codexから利用する場合: 任意の作業先で `codex-local` または `codex-local-fast`。
- Docker操作: `sudo docker compose -f ~/llm/compose.yaml …`。

このworkspaceにはLLMの起動スクリプトを置かない。`~/llm/` から登録した `~/bin/codex-local` / `~/bin/codex-local-fast` を使用する。呼び出した場所を作業先として維持する。
過去の診断データはGit対象外の `scratch/` にローカル保存したまま。新リポジトリへは公開しない。
測定結果は独立リポジトリの `RESULTS.md` を参照。
