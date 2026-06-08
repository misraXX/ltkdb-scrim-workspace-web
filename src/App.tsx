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
const spreadsheetUrl = "https://docs.google.com/spreadsheets/d/1Y8ZBhzr1M7EoOqmp-lKVvD54R45HapiXENh4aK_hr24/edit?gid=201#gid=201";
const clipFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLScMV6ErnMTeMzfvV1bE8-L5MDz4hMCiXM33MTqfPmPXSkSUHg/viewform";
const siteUrl = "https://demo-lab0110.github.io/ltk-schedule-status-site/";
const ga4Url = "https://analytics.google.com/analytics/web/?hl=ja#/a359323532p494142689/reports/intelligenthome";

const workspaceLinks = [
  { href: screenshotFolderUrl, label: "スクショフォルダ", icon: "folder" },
  { href: spreadsheetUrl, label: "スプシ", icon: "sheet" },
  { href: clipFormUrl, label: "クリップフォーム", icon: "form" },
  { href: siteUrl, label: "サイト", icon: "site" },
  { href: ga4Url, label: "GA4", icon: "analytics" },
] as const;

type WorkspaceLinkIcon = (typeof workspaceLinks)[number]["icon"];

function WorkspaceIcon({ icon }: { icon: WorkspaceLinkIcon }) {
  if (icon === "folder") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6.5h6.3l1.7 2h10v9.8a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 18.3V6.5Z" />
        <path d="M3 8.5V5.7c0-1.1.9-2 2-2h4.2l1.8 2.1h8c1.1 0 2 .9 2 2v.7" />
      </svg>
    );
  }

  if (icon === "sheet") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3.5h9l3 3v14H6v-17Z" />
        <path d="M15 3.5v3h3" />
        <path d="M8.5 10h7M8.5 13h7M8.5 16h7M11 10v6" />
      </svg>
    );
  }

  if (icon === "form") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3.5h12v17H6v-17Z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
        <circle cx="8" cy="8" r=".6" />
        <circle cx="8" cy="12" r=".6" />
        <circle cx="8" cy="16" r=".6" />
      </svg>
    );
  }

  if (icon === "site") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.2 3.3 8.5s-1.1 6.1-3.3 8.5M12 3.5C9.8 5.9 8.7 8.7 8.7 12s1.1 6.1 3.3 8.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19.5h16" />
      <path d="M6.5 16.5v-5M12 16.5v-9M17.5 16.5v-12" />
      <path d="M5 9.5 10 6l4 3 5-5" />
    </svg>
  );
}

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
  const refreshingAll = summaryLoading && uploadLoading && reviewLoading && scheduleLoading;

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
      result.updatedKinds.some((kind) => kind.startsWith("15分")) &&
      result.updatedKinds.some((kind) => kind.startsWith("RESULT"));

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
          <div className="button-row workspace-link-row">
            {workspaceLinks.map((link) => (
              <a
                key={link.href}
                className="ghost-button link-button icon-link-button"
                href={link.href}
                target="_blank"
                rel="noreferrer"
                title={link.label}
                aria-label={link.label}
              >
                <span className="icon-link-mark">
                  <WorkspaceIcon icon={link.icon} />
                </span>
                <span className="icon-link-text">{link.label}</span>
              </a>
            ))}
            <button type="button" className="ghost-button" onClick={() => void refreshAll()} disabled={refreshingAll}>
              {refreshingAll ? "更新中..." : "一覧更新"}
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
