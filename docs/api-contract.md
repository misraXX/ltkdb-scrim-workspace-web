# ScrimWorkspace API Contract

## 概要

A010 から A009 の GAS を `fetch` で呼ぶための API 契約です。  
ベース URL は `VITE_GAS_BASE_URL` に設定した Web アプリ URL を使います。

共通ルール:

- GET: `?api=scrim-workspace&action=...`
- POST: body に JSON を送る
- envelope は `{ ok, action, data?, error? }`

## 読み取り系

### `workspace-bootstrap`

初回表示に必要な主要データをまとめて返します。

返却データ:

- `summary`
- `upload`
- `review`
- `schedule`

### `workspace-summary`

上部件数用の集計を返します。

返却データ:

- `missingScreenshotCount`
- `pendingReviewCount`

### `upload-dialog`

スクショ提出タブの初期表示に必要なデータを返します。

返却データ:

- `candidates`
- `champions`

### `upload-match`

指定試合の BP 補助情報を返します。

パラメータ:

- `matchId`

### `review-list`

確認待ち試合の一覧を返します。

### `review-detail`

確認待ち試合 1 件分の詳細を返します。

パラメータ:

- `matchId`

返却データ:

- `summary`
- `result`
- `bp`
- `options.players`
- `options.champions`
- `counts.reviewIssues`

### `schedule-dialog`

予定と試合ID発行タブの初期表示データを返します。

返却データ:

- `defaultDate`
- `schedules`
- `teams`
- `tiers`
- `matchTypes`
- `stages`

### `planned-match`

既存予定を編集するときのデータを返します。

パラメータ:

- `scheduleId`

## 保存系

### `submit-upload`

スクショ提出を保存します。

payload:

- `matchChoice`
- `minute15Image`
- `resultImage`
- `minute15NoImage`
- `resultNoImage`

`minute15NoImage` / `resultNoImage` が `true` の場合、該当画像URL列へ `-` を保存し、画像なしの対応済みとして扱います。

### `save-manual-bp`

BP を保存します。

payload:

- `matchId`
- `blueTeamName`
- `redTeamName`
- `imageUrl`
- `note`
- `bans`
- `picks`

### `save-review`

確認待ちの編集内容を保存します。

payload:

- `matchId`
- `summary`
- `result`
- `bp`
- `resultRecord`

### `approve-review`

確認待ちの内容を承認します。

payload は `save-review` と同じです。

### `save-planned-match`

予定と試合ID発行を保存します。

payload:

- `editMode`
- `scheduleId`
- `eventDate`
- `eventTime`
- `dayLabel`
- `matchType`
- `stage`
- `tier`
- `leftTeamKey`
- `rightTeamKey`
- `blueTeamKey`
- `redTeamKey`
- `gameCount`
- `sourceImage`
- `memo`
- `resultIds`

## 注意点

- A010 では既存 payload 形式を維持する
- GAS 側の関数名は backend 互換を優先する
- UI 表示名と backend 内部キーは一致しなくてもよい
