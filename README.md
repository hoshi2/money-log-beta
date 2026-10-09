# お金（money-log / STELLA FINANCE）

個人・法人の財務と借金の返済計画を見える化するアプリ。React + Vite。

旧リポジトリ名は `-`（ハイフン1文字）。2026-09-20 に `money-log` へ改名しました。

公開URL: https://hoshi2.github.io/money-log/

## 画面

ホーム（純資産・借金残高・今月使える額）／ 資産収支 ／ 借金① ／ 借金Ⅱ7月 ／ 未払い ／ CF ／ 設定

## データの扱い

- ブラウザの `localStorage`（キー `stella_v2`）に保存。サーバーへは送らない
- 設定タブでFirebaseを設定するとクラウド保存が有効になり、端末間で同期する
  （Firestoreのコレクションは `stella`。習慣アプリは `p26`、ロイログは `roylog`）
- 設定タブからJSONのバックアップ書き出し・復元ができる

## 開発

```
npm install
npm run dev
```
