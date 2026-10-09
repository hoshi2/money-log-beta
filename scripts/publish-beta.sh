#!/bin/sh
# ベータ版の公開（初回だけ）。本番とは別の公開 repo hoshi2/money-log-beta を作り、今の branch を main として送り、GitHub Pages を有効にする。
# 2回目以降は「git push beta <branch>:main」だけでよい。
set -e
cd "$(dirname "$0")/.."
BRANCH=$(git branch --show-current)
gh repo create hoshi2/money-log-beta --public --description "マネーログ ベータ（試作）。保存は本番と別、同期オフ" >/dev/null
git remote add beta https://github.com/hoshi2/money-log-beta.git 2>/dev/null || true
git push beta "$BRANCH:main"
gh api -X POST repos/hoshi2/money-log-beta/pages -f build_type=workflow >/dev/null
echo "done: https://github.com/hoshi2/money-log-beta  ->  https://hoshi2.github.io/money-log-beta/ (公開処理に数分)"
