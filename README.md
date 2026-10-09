# お金（money-log）

固定費・借金・未払いを1画面ずつ見える化する個人用アプリ。React + Vite。

公開URL: https://hoshi2.github.io/money-log/
ベータ（試作）: https://hoshi2.github.io/money-log-beta/ （保存は本番と別、同期オフ）

## 画面

ホーム（借金の総額・今月の支払い・直近の期限）／ 固定費・サブスク（月払い・年払い）／ 毎月返済（残り・月額）／ 期限つき（期限順、7日以内と期限切れは赤）／ 未払い ／ 設定

## データの扱い

- ブラウザの `localStorage`（キー `stella_v3`。ベータは `stella_v3_beta`）に保存。サーバーへは送らない
- 旧版（キー `stella_v2`）のデータは初回起動時に自動で変換して引き継ぐ。旧データは消さない
- 設定タブでFirebaseを設定するとクラウド保存が有効になり、端末間で同期する
  （Firestoreのコレクション `stella`、ドキュメント `{同期コード}-v3`。旧版の `{同期コード}` は読むだけ）
- 設定タブからJSONのバックアップ書き出し・復元ができる（旧形式も読み込める）
- ソースに実データは入れない（`src/data/initial.js` は空の雛形）

## 開発

```
npm install
npm run dev          # 本番と同じ動き
VITE_BETA=1 npm run dev   # ベータの動き（別の保存名、同期オフ、「本番データを読み込む」ボタン）
npm test
```
