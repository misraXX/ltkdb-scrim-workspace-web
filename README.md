# LTKDB Scrim Workspace Web

## 概要

`A009 LTKDB スクリム画像取り込み` で運用していた `ScrimWorkspace` の UI を、
通常の Web フロントへ移したプロジェクトです。

方針は次のとおりです。

- データベースは Google スプレッドシートのまま使う
- 画像保存先は Google Drive のまま使う
- GAS は backend / API として残す
- `ScrimWorkspace` の UI だけを Web 側へ移す

## 現在の対象機能

この Web アプリでは、次の 3 つの作業を 1 画面で扱います。

- `予定と試合ID発行`
- `スクショ提出`
- `確認待ち`

## 現状

- A010 は Vite + React + TypeScript で実装
- `スクショ提出` は GAS 実データで動作
- `予定と試合ID発行` は GAS 実データで動作
- `確認待ち` は一覧、詳細、保存、承認まで Web 側へ移行済み
- 上部件数、Drive フォルダ導線、操作後の自動再読込も実装済み

## backend API

A010 から使っている主な GAS API は次のとおりです。

- `workspace-summary`
- `workspace-bootstrap`
- `upload-dialog`
- `upload-match`
- `review-list`
- `review-detail`
- `schedule-dialog`
- `planned-match`
- `submit-upload`
- `save-manual-bp`
- `save-review`
- `approve-review`
- `save-planned-match`

詳細は [docs/api-contract.md](C:\Users\Akira%20HYASHI\OneDrive\%E3%83%89%E3%82%AD%E3%83%A5%E3%83%A1%E3%83%88%5CNew%20project%202%5CA010%20LTKDB%20Scrim%20Workspace%20Web%5Cdocs%5Capi-contract.md) を参照してください。

## backend 側で残す GAS ファイル

- `Code.gs`
- `gas/scrim_upload_form.gs`
- `gas/scrim_review.gs`
- `gas/schedule_planner.gs`
- `gas/manual_bp_dialog.gs`
- `gas/scrim_workspace_api.gs`

## セットアップ

```bash
npm install
npm run dev
```

## GAS 接続設定

`.env.local` を作成して、少なくとも次を設定します。

```bash
VITE_GAS_MODE=gas
VITE_GAS_BASE_URL=https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxx/exec
```

ローカル確認だけをしたい場合は、`VITE_GAS_MODE=mock` でも動かせます。

## 参考ドキュメント

- [docs/migration-plan.md](C:\Users\Akira%20HYASHI\OneDrive\%E3%83%89%E3%82%AD%E3%83%A5%E3%83%A1%E3%83%88%5CNew%20project%202%5CA010%20LTKDB%20Scrim%20Workspace%20Web%5Cdocs%5Cmigration-plan.md)
- [docs/api-contract.md](C:\Users\Akira%20HYASHI\OneDrive\%E3%83%89%E3%82%AD%E3%83%A1%E3%83%88%5CNew%20project%202%5CA010%20LTKDB%20Scrim%20Workspace%20Web%5Cdocs%5Capi-contract.md)

## 補足

- A010 側は UI 主導線
- A009 側は backend / legacy 整理フェーズ
- payload 形式とシート保存仕様は既存運用互換を優先しています
