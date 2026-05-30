import { Fragment, useState } from "react";
import type {
  ReviewDetailData,
  ReviewListItem,
  SavePendingReviewPayload,
  SavePendingReviewResult,
} from "../types";

type ReviewTabProps = {
  items: ReviewListItem[];
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
  onLoadDetail: (matchId: string) => Promise<ReviewDetailData>;
  onSave: (payload: SavePendingReviewPayload) => Promise<SavePendingReviewResult>;
  onApprove: (payload: SavePendingReviewPayload) => Promise<SavePendingReviewResult>;
};

type ReviewImageItem = {
  label: string;
  url: string;
};

function copyRows(rows: Array<Record<string, string>>) {
  return rows.map((row) => ({ ...row }));
}

function getValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return "";
}

function extractDriveFileId(url: string) {
  const value = String(url || "").trim();
  if (!value) return "";

  const fileMatch = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  const idMatch = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  return "";
}

function toPreviewImageUrl(url: string) {
  const fileId = extractDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

function getSummaryImageItems(summary: Record<string, string>): ReviewImageItem[] {
  const pairs: Array<{ label: string; keys: string[] }> = [
    { label: "15分", keys: ["15分画像URL", "15分URL", "15蛻・判蜒酋RL", "15蛻・RL"] },
    { label: "RESULT", keys: ["リザルト画像URL", "RESULT画像URL", "繝ｪ繧ｶ繝ｫ繝育判蜒酋RL", "RESULT逕ｻ蜒酋RL"] },
  ];

  return pairs
    .map((pair) => ({
      label: pair.label,
      url: getValue(summary, pair.keys),
    }))
    .filter((item) => item.url);
}

export function ReviewTab({
  items,
  loading,
  error,
  onRefresh,
  onLoadDetail,
  onSave,
  onApprove,
}: ReviewTabProps) {
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [detail, setDetail] = useState<ReviewDetailData | null>(null);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [resultRows, setResultRows] = useState<Array<Record<string, string>>>([]);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLoadDetail() {
    if (!selectedMatchId) {
      setStatus("確認したい試合を選択してください。");
      return;
    }

    setSubmitting(true);
    try {
      const response = await onLoadDetail(selectedMatchId);
      setDetail(response);
      setSummary({ ...response.summary });
      setResultRows(copyRows(response.result));
      setStatus("確認待ちデータを読み込みました。");
    } catch (loadError) {
      setStatus(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setSubmitting(false);
    }
  }

  function updateSummaryField(keys: string[], value: string) {
    setSummary((current) => {
      const next = { ...current };
      keys.forEach((key) => {
        next[key] = value;
      });
      return next;
    });
  }

  function updateResultRow(index: number, keys: string[], value: string) {
    setResultRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row };
        keys.forEach((key) => {
          next[key] = value;
        });
        return next;
      }),
    );
  }

  function buildPayload(): SavePendingReviewPayload {
    return {
      matchId: detail?.matchId || selectedMatchId,
      summary,
      result: resultRows,
      bp: detail?.bp || [],
      resultRecord: summary.result_record || "",
    };
  }

  async function handleSave() {
    if (!detail) {
      setStatus("先に確認待ちデータを読み込んでください。");
      return;
    }

    setSubmitting(true);
    try {
      const response = await onSave(buildPayload());
      setStatus(`編集を保存しました。試合ID: ${response.matchId}`);
      await onRefresh();
    } catch (saveError) {
      setStatus(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove() {
    if (!detail) {
      setStatus("先に確認待ちデータを読み込んでください。");
      return;
    }

    setSubmitting(true);
    try {
      const response = await onApprove(buildPayload());
      setStatus(
        `承認しました。試合ID: ${response.matchId}${
          response.playerUpdates ? ` / 選手更新: ${response.playerUpdates}` : ""
        }`,
      );
      await onRefresh();
    } catch (approveError) {
      setStatus(approveError instanceof Error ? approveError.message : String(approveError));
    } finally {
      setSubmitting(false);
    }
  }

  const imageItems = getSummaryImageItems(summary);

  return (
    <section className="workspace-section">
      <div className="section-toolbar">
        <div>
          <h2>確認待ち</h2>
          <p className="section-copy">
            一覧から対象試合を選んで、確認・修正・承認を進めます。
          </p>
        </div>
        <button type="button" className="ghost-button" onClick={() => void onRefresh()} disabled={loading}>
          一覧更新
        </button>
      </div>

      <article className="workspace-card">
        {loading ? <p className="status-text">読み込み中...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="field-grid">
              <label className="field">
                <span>確認待ち試合</span>
                <select value={selectedMatchId} onChange={(event) => setSelectedMatchId(event.target.value)}>
                  <option value="">選択してください</option>
                  {items.map((item) => (
                    <option key={item.matchId} value={item.matchId}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="button-row">
              <button type="button" className="ghost-button" onClick={() => void handleLoadDetail()} disabled={submitting}>
                詳細を読込
              </button>
              <button type="button" className="ghost-button" onClick={() => void handleSave()} disabled={submitting || !detail}>
                編集を保存
              </button>
              <button type="button" className="primary-button" onClick={() => void handleApprove()} disabled={submitting || !detail}>
                承認する
              </button>
            </div>

            {detail ? (
              <div className="review-detail-layout">
                <section className="workspace-card review-images">
                  <div className="section-toolbar">
                    <h3>画像</h3>
                    <p className="status-text">{imageItems.length ? `${imageItems.length}枚` : "画像なし"}</p>
                  </div>

                  {imageItems.length ? (
                    <div className="review-image-list">
                      {imageItems.map((item) => (
                        <article className="review-image-card" key={item.label}>
                          <div className="section-toolbar">
                            <h3>{item.label}</h3>
                            <a href={item.url} target="_blank" rel="noreferrer" className="review-image-link">
                              別タブで開く
                            </a>
                          </div>
                          <img src={toPreviewImageUrl(item.url)} alt={item.label} className="review-image" />
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="status-text">画像URLがまだ登録されていません。</p>
                  )}
                </section>

                <section className="review-edit-stack">
                  <div className="workspace-card">
                    <div className="field-grid">
                      <label className="field">
                        <span>勝利チーム</span>
                        <input
                          value={getValue(summary, ["勝利チーム", "勝利チーム名", "蜍晏茜繝√・繝", "蜍晏茜繝√・繝蜷・"])}
                          onChange={(event) =>
                            updateSummaryField(
                              ["勝利チーム", "勝利チーム名", "蜍晏茜繝√・繝", "蜍晏茜繝√・繝蜷・"],
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="field">
                        <span>試合時間</span>
                        <input
                          value={getValue(summary, ["試合時間", "試合時間(分:秒)", "隧ｦ蜷域凾髢・", "隧ｦ蜷域凾髢難ｼ亥・:遘抵ｼ・"])}
                          onChange={(event) =>
                            updateSummaryField(
                              ["試合時間", "試合時間(分:秒)", "隧ｦ蜷域凾髢・", "隧ｦ蜷域凾髢難ｼ亥・:遘抵ｼ・"],
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span>メモ</span>
                      <textarea
                        value={getValue(summary, ["メモ", "確認メモ", "繝｡繝｢", "隕∫｢ｺ隱阪Γ繝｢"])}
                        onChange={(event) =>
                          updateSummaryField(["メモ", "確認メモ", "繝｡繝｢", "隕∫｢ｺ隱阪Γ繝｢"], event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <div className="workspace-card">
                    <div className="section-toolbar">
                      <h3>リザルト詳細</h3>
                      <p className="status-text">要確認 {detail.counts.reviewIssues}件</p>
                    </div>

                    <div className="review-grid">
                      <div className="review-grid-head">サイド</div>
                      <div className="review-grid-head">ロール</div>
                      <div className="review-grid-head">プレイヤー名</div>
                      <div className="review-grid-head">チャンピオン名</div>
                      <div className="review-grid-head">K</div>
                      <div className="review-grid-head">D</div>
                      <div className="review-grid-head">A</div>
                      <div className="review-grid-head">15分CS</div>

                      {resultRows.map((row, index) => (
                        <Fragment key={`row-${index}`}>
                          <div className="review-grid-cell">{getValue(row, ["サイド", "SIDE", "繧ｵ繧､繝・"])}</div>
                          <div className="review-grid-cell">{getValue(row, ["ロール", "ROLE", "繝ｭ繝ｼ繝ｫ"])}</div>
                          <select
                            value={getValue(row, ["プレイヤー名", "選手名", "繝励Ξ繧､繝､繝ｼ蜷・", "驕ｸ謇句錐"])}
                            onChange={(event) =>
                              updateResultRow(
                                index,
                                ["プレイヤー名", "選手名", "繝励Ξ繧､繝､繝ｼ蜷・", "驕ｸ謇句錐"],
                                event.target.value,
                              )
                            }
                          >
                            <option value="">選択</option>
                            {detail.options.players.map((player) => (
                              <option key={player} value={player}>
                                {player}
                              </option>
                            ))}
                          </select>
                          <select
                            value={getValue(row, ["チャンピオン名", "使用チャンピオン", "繝√Ε繝ｳ繝斐が繝ｳ蜷・", "菴ｿ逕ｨ繝√Ε繝ｳ繝斐が繝ｳ"])}
                            onChange={(event) =>
                              updateResultRow(
                                index,
                                ["チャンピオン名", "使用チャンピオン", "繝√Ε繝ｳ繝斐が繝ｳ蜷・", "菴ｿ逕ｨ繝√Ε繝ｳ繝斐が繝ｳ"],
                                event.target.value,
                              )
                            }
                          >
                            <option value="">選択</option>
                            {detail.options.champions.map((champion) => (
                              <option key={champion} value={champion}>
                                {champion}
                              </option>
                            ))}
                          </select>
                          <input value={getValue(row, ["K"])} onChange={(event) => updateResultRow(index, ["K"], event.target.value)} />
                          <input value={getValue(row, ["D"])} onChange={(event) => updateResultRow(index, ["D"], event.target.value)} />
                          <input value={getValue(row, ["A"])} onChange={(event) => updateResultRow(index, ["A"], event.target.value)} />
                          <input
                            value={getValue(row, ["15分CS", "15分S", "15蛻・S", "15蛻・CS"])}
                            onChange={(event) =>
                              updateResultRow(index, ["15分CS", "15分S", "15蛻・S", "15蛻・CS"], event.target.value)
                            }
                          />
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            ) : null}

            <p className="status-text">{status || "確認待ち試合を選ぶとここに状態を表示します。"}</p>
          </>
        ) : null}
      </article>
    </section>
  );
}
