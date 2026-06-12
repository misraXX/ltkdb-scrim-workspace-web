import { useState } from "react";
import type { MatchOption, UploadDialogData } from "../types";

type UploadTabProps = {
  data: UploadDialogData | null;
  loading: boolean;
  loadError: string;
  onRefresh: () => Promise<void>;
  onSubmitImages: (payload: {
    matchChoice: string;
    minute15Image: string;
    resultImage: string;
    minute15NoImage?: boolean;
    resultNoImage?: boolean;
  }) => Promise<{ matchId: string; updatedKinds: string[] }>;
};

type UploadRowState = {
  minute15File: File | null;
  resultFile: File | null;
  minute15NoImage: boolean;
  resultNoImage: boolean;
  submitting: boolean;
  status: string;
  resetKey: number;
};

function createEmptyRowState(): UploadRowState {
  return {
    minute15File: null,
    resultFile: null,
    minute15NoImage: false,
    resultNoImage: false,
    submitting: false,
    status: "",
    resetKey: 0,
  };
}

function fileToDataUrl(file: File | null): Promise<string> {
  if (!file) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function UploadTab({ data, loading, loadError, onRefresh, onSubmitImages }: UploadTabProps) {
  const candidates = data?.candidates ?? [];
  const [rowStates, setRowStates] = useState<Record<string, UploadRowState>>({});

  function getRowState(matchId: string) {
    return rowStates[matchId] ?? createEmptyRowState();
  }

  function updateRowState(
    matchId: string,
    updater: Partial<UploadRowState> | ((current: UploadRowState) => UploadRowState),
  ) {
    setRowStates((current) => {
      const previous = current[matchId] ?? createEmptyRowState();
      const next = typeof updater === "function" ? updater(previous) : { ...previous, ...updater };
      return { ...current, [matchId]: next };
    });
  }

  function setMinute15NoImage(matchId: string, checked: boolean) {
    updateRowState(matchId, (current) => ({
      ...current,
      minute15NoImage: checked,
      minute15File: checked ? null : current.minute15File,
      resetKey: checked ? current.resetKey + 1 : current.resetKey,
    }));
  }

  function setResultNoImage(matchId: string, checked: boolean) {
    updateRowState(matchId, (current) => ({
      ...current,
      resultNoImage: checked,
      resultFile: checked ? null : current.resultFile,
      resetKey: checked ? current.resetKey + 1 : current.resetKey,
    }));
  }

  async function handleSubmit(candidate: MatchOption) {
    const state = getRowState(candidate.matchId);
    const hasMinute15 = Boolean(state.minute15File) || state.minute15NoImage;
    const hasResult = Boolean(state.resultFile) || state.resultNoImage;

    if (!hasMinute15 && !hasResult) {
      updateRowState(candidate.matchId, { status: "15分画像かリザルト画像を指定してください。" });
      return;
    }

    updateRowState(candidate.matchId, { submitting: true, status: "送信中..." });
    try {
      const [minute15Image, resultImage] = await Promise.all([
        fileToDataUrl(state.minute15File),
        fileToDataUrl(state.resultFile),
      ]);
      const response = await onSubmitImages({
        matchChoice: candidate.label,
        minute15Image,
        resultImage,
        minute15NoImage: state.minute15NoImage,
        resultNoImage: state.resultNoImage,
      });

      updateRowState(candidate.matchId, (current) => ({
        ...current,
        minute15File: null,
        resultFile: null,
        minute15NoImage: false,
        resultNoImage: false,
        submitting: false,
        status: `送信しました。更新: ${response.updatedKinds.join(", ") || "なし"}`,
        resetKey: current.resetKey + 1,
      }));
    } catch (error) {
      updateRowState(candidate.matchId, {
        submitting: false,
        status: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <section className="workspace-section">
      <div className="section-toolbar">
        <div>
          <h2>スクショ提出</h2>
          <p className="section-copy">
            未提出のスクリムごとに、15分画像とリザルト画像を指定して送信します。
          </p>
        </div>
        <button type="button" className="ghost-button" onClick={() => void onRefresh()} disabled={loading}>
          {loading ? "再読込中..." : "候補を再読込"}
        </button>
      </div>

      {loadError ? <p className="error-text">読込エラー: {loadError}</p> : null}

      {loading ? <p className="status-text">未提出スクリムを読み込んでいます。</p> : null}

      {!loading && !loadError && candidates.length === 0 ? (
        <article className="workspace-card">
          <p className="status-text">未提出のスクリムはありません。</p>
        </article>
      ) : null}

      {!loading && candidates.length ? (
        <div className="upload-list">
          {candidates.map((candidate) => {
            const state = getRowState(candidate.matchId);
            return (
              <article className="workspace-card upload-row-card" key={candidate.matchId}>
                <div className="upload-row-main">
                  <div className="upload-row-title">
                    <strong>{candidate.label}</strong>
                    <span className="upload-row-id">{candidate.matchId}</span>
                  </div>

                  <div className="upload-row-actions">
                    <div className="field upload-file-field">
                      <span>15分画像</span>
                      <input
                        key={`minute15-${candidate.matchId}-${state.resetKey}`}
                        type="file"
                        accept="image/*"
                        disabled={state.minute15NoImage || state.submitting}
                        onChange={(event) =>
                          updateRowState(candidate.matchId, {
                            minute15File: event.target.files?.[0] ?? null,
                            status: "",
                          })
                        }
                      />
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={state.minute15NoImage}
                          disabled={state.submitting}
                          onChange={(event) => setMinute15NoImage(candidate.matchId, event.target.checked)}
                        />
                        <span>画像なし</span>
                      </label>
                    </div>

                    <div className="field upload-file-field">
                      <span>リザルト画像</span>
                      <input
                        key={`result-${candidate.matchId}-${state.resetKey}`}
                        type="file"
                        accept="image/*"
                        disabled={state.resultNoImage || state.submitting}
                        onChange={(event) =>
                          updateRowState(candidate.matchId, {
                            resultFile: event.target.files?.[0] ?? null,
                            status: "",
                          })
                        }
                      />
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={state.resultNoImage}
                          disabled={state.submitting}
                          onChange={(event) => setResultNoImage(candidate.matchId, event.target.checked)}
                        />
                        <span>画像なし</span>
                      </label>
                    </div>

                    <div className="upload-submit-cell">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => void handleSubmit(candidate)}
                        disabled={state.submitting}
                      >
                        {state.submitting ? "送信中..." : "送信"}
                      </button>
                    </div>
                  </div>

                  {state.status ? <p className="status-text upload-row-status">{state.status}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
