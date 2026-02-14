# AGENTS

## Coding Rules
- 時間操作には `dayjs` を使用し、`Date` は使用しないこと。
- DBの各テーブルに対応するモデルクラスは `server/src/db/models` 以下に配置すること。
- モデルクラスでは、モデル本体の `class` とは別に同名 `namespace` を定義し、`Data` 型を `export` すること。`Data` は対応テーブルのカラム名を `camelCase` にした key を持つオブジェクト型として定義し、value は対応カラム型と一致させること。
- モデルクラスは `server/src/db/Model.ts` を継承して作成し、ジェネリクスには `namespace` で定義した `Data` を使用すること。テーブル名は `protected static _tableName = 'table_name'` の形式で指定し、`Data` の各 prop について getter を作成すること。getter の戻り値は `this._data.{key}` から取得すること。
- DB操作は `supabase` クライアントを直接使用せず、必ずモデルクラス経由で実行すること。
- `server/src/db/Model.ts` 以外で `supabase` を直接 `import` しないこと。
- モデルの外に返すデータ構造は常に `Data` 型（camelCase）に統一すること。
- 生SQLやDB固有機能の直接利用は最小化し、可能な限りモデル層に閉じ込めること。
- 変更を加えたファイルに対しては、作業後に必ず `eslint --fix` を実行すること。
