import { useEffect, useState } from "react";
import { createGasApi } from "./api/gas";
import { ReviewTab } from "./components/ReviewTab";
import { ScheduleTab } from "./components/ScheduleTab";
import { UploadTab } from "./components/UploadTab";
import type {
  PlannedMatchEditData,
  ReviewDetailData,
  ReviewListItem,
  SaveManualBpPayload,
  SaveManualBpResult,
  SavePendingReviewPayload,
  SavePendingReviewResult,
  SavePlannedMatchPayload,
  SavePlannedMatchResult,
  ScheduleDialogData,
  SubmitUploadPayload,
  SubmitUploadResult,
  UploadDialogData,
  WorkspaceSummary,
  WorkspaceTab,
} from "./types";

const gasApi = createGasApi();
const screenshotFolderUrl = "https://drive.google.com/drive/folders/1aHsyaxnplaExCNWfe_2atefN9ohSX5IG";

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "schedule", label: "予定と試合ID発行" },
  { id: "upload", label: "スクショ提出" },
  { id: "review", label: "確認待ち" },
];

const emptySummary: WorkspaceSummary = {
  missingScreenshotCount: 0,
  pendingReviewCount: 0,
};

const apiMode = import.meta.env.VITE_GAS_MODE === "gas" ? "gas" : "mock";

export function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("schedule");
  const [summary, setSummary] = useState<WorkspaceSummary>(emptySummary);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [uploadData, setUploadData] = useState<UploadDialogData | null>(null);
  const [uploadLoading, setUploadLoading] = useState(true);
  const [uploadError, setUploadError] = useState("");

  const [reviewItems, setReviewItems] = useState<ReviewListItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");

  const [scheduleData, setScheduleData] = useState<ScheduleDialogData | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState("");

  async function refreshAll() {
    setSummaryLoading(true);
    setUploadLoading(true);
    setReviewLoading(true);
    setScheduleLoading(true);

    try {
      const bootstrap = await gasApi.getWorkspaceBootstrap();
      setSummary(bootstrap.summary);
      setSummaryError("");
      setUploadData(bootstrap.upload);
      setUploadError("");
      setReviewItems(bootstrap.review);
      setReviewError("");
      setScheduleData(bootstrap.schedule);
      setScheduleError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSummaryError(message);
      setUploadError(message);
      setReviewError(message);
      setScheduleError(message);
    } finally {
      setSummaryLoading(false);
      setUploadLoading(false);
      setReviewLoading(false);
      setScheduleLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const result = await gasApi.getWorkspaceSummary();
      setSummary(result);
      setSummaryError("");
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : String(error));
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadUploadData() {
    setUploadLoading(true);
    try {
      const result = await gasApi.getUploadDialogData();
      setUploadData(result);
      setUploadError("");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : String(error));
    } finally {
      setUploadLoading(false);
    }
  }

  async function loadReviewList() {
    setReviewLoading(true);
    try {
      const result = await gasApi.getPendingReviewList();
      setReviewItems(result);
      setReviewError("");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : String(error));
    } finally {
      setReviewLoading(false);
    }
  }

  async function loadScheduleData() {
    setScheduleLoading(true);
    try {
      const result = await gasApi.getScheduleDialogData();
      setScheduleData(result);
      setScheduleError("");
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : String(error));
    } finally {
      setScheduleLoading(false);
    }
  }

  async function handleSubmitImages(payload: SubmitUploadPayload): Promise<SubmitUploadResult> {
    const result = await gasApi.submitScrimUploadDialog(payload);
    const completedRequiredImages =
      result.updatedKinds.includes("15分") && result.updatedKinds.includes("RESULT");

    if (completedRequiredImages) {
      setUploadData((current) =>
        current
          ? {
              ...current,
              candidates: current.candidates.filter((candidate) => candidate.matchId !== result.matchId),
            }
          : current,
      );
      setSummary((current) => ({
        ...current,
        missingScreenshotCount: Math.max(0, current.missingScreenshotCount - 1),
      }));
    }

    return result;
  }

  async function handleSaveBp(payload: SaveManualBpPayload): Promise<SaveManualBpResult> {
    const result = await gasApi.saveManualBp(payload);
    return result;
  }

  async function handleSaveReview(payload: SavePendingReviewPayload): Promise<SavePendingReviewResult> {
    const result = await gasApi.savePendingReview(payload);
    return result;
  }

  async function handleApproveReview(payload: SavePendingReviewPayload): Promise<SavePendingReviewResult> {
    const result = await gasApi.approvePendingReview(payload);
    setReviewItems((current) => current.filter((item) => item.matchId !== result.matchId));
    setSummary((current) => ({
      ...current,
      pendingReviewCount: Math.max(0, current.pendingReviewCount - 1),
    }));
    return result;
  }

  async function handleSaveSchedule(payload: SavePlannedMatchPayload): Promise<SavePlannedMatchResult> {
    const result = await gasApi.savePlannedMatch(payload);
    return result;
  }

  return (
    <div className="app-shell">
      <header className="workspace-header">
        <div className="workspace-header-main">
          <div>
            <p className="eyebrow">LTKDB</p>
            <h1>Scrim Workspace Web</h1>
            <p className="lede">
              {`ScrimWorkspace の UI を Web 側へ移した新フロントです。現在は ${
                apiMode === "gas" ? "GAS 実データ" : "mock データ"
              } で動作しています。`}
            </p>
          </div>
          <div className="button-row">
            <a className="ghost-button link-button" href={screenshotFolderUrl} target="_blank" rel="noreferrer">
              スクショフォルダ
            </a>
            <button type="button" className="ghost-button" onClick={() => void refreshAll()}>
              一覧更新
            </button>
          </div>
        </div>

        <div className="summary-grid">
          <section className={`summary-card ${summary.missingScreenshotCount > 0 ? "is-hot" : "is-calm"}`}>
            <span className="summary-label">スクショ未提出</span>
            <strong className="summary-value">
              {summaryLoading ? "読み込み中" : `${summary.missingScreenshotCount}件`}
            </strong>
            {summaryError ? <span className="summary-help">取得失敗</span> : null}
          </section>

          <section className={`summary-card ${summary.pendingReviewCount > 0 ? "is-hot review" : "is-calm"}`}>
            <span className="summary-label">確認待ち</span>
            <strong className="summary-value">
              {summaryLoading ? "読み込み中" : `${summary.pendingReviewCount}件`}
            </strong>
            {summaryError ? <span className="summary-help">取得失敗</span> : null}
          </section>
        </div>
      </header>

      <nav className="tabs" aria-label="Scrim workspace tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "schedule" ? (
        <ScheduleTab
          data={scheduleData}
          loading={scheduleLoading}
          error={scheduleError}
          onRefresh={loadScheduleData}
          onLoadSchedule={(scheduleId: string) => gasApi.getPlannedMatchForEdit(scheduleId)}
          onSave={handleSaveSchedule}
        />
      ) : null}

      {activeTab === "upload" ? (
        <UploadTab
          data={uploadData}
          loading={uploadLoading}
          loadError={uploadError}
          onRefresh={loadUploadData}
          onLoadMatch={(matchId: string) => gasApi.getManualBpMatchInfo(matchId)}
          onSubmitImages={handleSubmitImages}
          onSaveBp={handleSaveBp}
        />
      ) : null}

      {activeTab === "review" ? (
        <ReviewTab
          items={reviewItems}
          loading={reviewLoading}
          error={reviewError}
          onRefresh={loadReviewList}
          onLoadDetail={(matchId: string) => gasApi.getPendingReviewDetail(matchId)}
          onSave={handleSaveReview}
          onApprove={handleApproveReview}
        />
      ) : null}
    </div>
  );
}

export default App;
