# ScrimWorkspace Web 移行メモ

## 目的

`A009` で運用していた `ScrimWorkspace` の UI を、通常の Web アプリへ移して保守しやすくする。  
スプレッドシートと Drive はそのまま使い、GAS は backend / API として残す。

## 役割分担

### A009 に残すもの

- スプレッドシート更新
- Drive 保存
- 試合ID発行
- 確認待ち保存と承認
- BP保存
- Web API 入口

### A010 に移すもの

- 画面表示
- タブ切替
- 入力フォーム
- 画像確認 UI
- 保存後の状態更新

## 進捗

### Phase 1: 土台

- Vite + React + TypeScript を作成
- mock データで 3 タブの UI を用意

### Phase 2: スクショ提出

- `upload-dialog`
- `upload-match`
- `submit-upload`
- `save-manual-bp`

この段階で `スクショ提出` を GAS 実データで動かせるようにした。

### Phase 3: 確認待ち

- `review-list`
- `review-detail`
- `save-review`
- `approve-review`

この段階で `確認待ち` の一覧、詳細、保存、承認を Web 側へ移した。

### Phase 4: 予定と試合ID発行

- `schedule-dialog`
- `planned-match`
- `save-planned-match`

この段階で `予定と試合ID発行` を Web 側へ移した。

### Phase 5: bootstrap

- `workspace-summary`
- `workspace-bootstrap`

この段階で、初回ロード時に必要なデータをまとめて取得するようにした。

## 現在の状態

- A010 が日常利用の主導線
- A009 は backend / legacy UI 整理フェーズ
- 保存 payload は既存仕様を維持
- スプレッドシート構造は変更していない

## legacy 側の整理方針

### 既に整理済み

- A009 ローカルの旧分割 HTML
- Apps Script 側の旧分割 HTML
- 旧 UI 前提だった設計書の現行化

### これから整理するもの

- A009 の旧 dialog 入口関数
- `Code.gs` に残る死コード
- 旧 menu / route の最終削除

## 注意点

- backend ロジックは A009 側で引き続き使う
- A010 からは `scrim_workspace_api.gs` 経由で呼ぶ
- GAS 側の関数名は不用意に変更しない
- payload 形式は既存運用互換を優先する
