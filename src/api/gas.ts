import {
  approveMockPendingReview,
  getMockManualBpMatchInfo,
  getMockPlannedMatchForEdit,
  getMockPendingReviewDetail,
  getMockPendingReviewList,
  getMockScheduleDialogData,
  getMockUploadDialogData,
  getMockWorkspaceSummary,
  saveMockManualBp,
  saveMockPendingReview,
  saveMockPlannedMatch,
  submitMockUpload,
} from "../mock";
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
  UploadMatchDetail,
  WorkspaceBootstrapData,
  WorkspaceSummary,
} from "../types";

export type GasApiConfig = {
  baseUrl: string;
  mode: "mock" | "gas";
};

type GasApiEnvelope<T> = {
  ok: boolean;
  action: string;
  data?: T;
  error?: {
    message?: string;
  };
};

const defaultConfig: GasApiConfig = {
  baseUrl: import.meta.env.VITE_GAS_BASE_URL ?? "",
  mode: import.meta.env.VITE_GAS_MODE === "gas" ? "gas" : "mock",
};

function buildApiUrl(baseUrl: string, action: string, params?: Record<string, string>) {
  const url = new URL(baseUrl);
  url.searchParams.set("api", "scrim-workspace");
  url.searchParams.set("action", action);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  return url.toString();
}

async function readEnvelope<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`GAS API request failed: ${response.status}`);
  }

  const json = (await response.json()) as GasApiEnvelope<T>;
  if (!json.ok) {
    throw new Error(json.error?.message || `GAS API action failed: ${json.action}`);
  }

  return json.data as T;
}

export function createGasApi(config: Partial<GasApiConfig> = {}) {
  const resolved = { ...defaultConfig, ...config };
  const baseUrl = resolved.baseUrl.trim();
  const useMock = resolved.mode === "mock" || !baseUrl;

  async function getAction<T>(action: string, params?: Record<string, string>) {
    const response = await fetch(buildApiUrl(baseUrl, action, params), {
      method: "GET",
    });
    return readEnvelope<T>(response);
  }

  async function postAction<T>(action: string, payload: unknown) {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        api: "scrim-workspace",
        action,
        payload,
      }),
    });
    return readEnvelope<T>(response);
  }

  async function buildWorkspaceSummaryFallback() {
    const [uploadDialog, reviewList] = await Promise.all([
      getAction<UploadDialogData>("upload-dialog"),
      getAction<ReviewListItem[]>("review-list"),
    ]);

    return {
      missingScreenshotCount: uploadDialog.candidates.length,
      pendingReviewCount: reviewList.length,
    } satisfies WorkspaceSummary;
  }

  return {
    async getWorkspaceBootstrap(): Promise<WorkspaceBootstrapData> {
      if (useMock) {
        return {
          summary: await getMockWorkspaceSummary(),
          upload: await getMockUploadDialogData(),
          review: await getMockPendingReviewList(),
          schedule: await getMockScheduleDialogData(),
        };
      }

      try {
        return await getAction<WorkspaceBootstrapData>("workspace-bootstrap");
      } catch (error) {
        const [summary, upload, review, schedule] = await Promise.all([
          this.getWorkspaceSummary(),
          this.getUploadDialogData(),
          this.getPendingReviewList(),
          this.getScheduleDialogData(),
        ]);
        return { summary, upload, review, schedule };
      }
    },
    async getWorkspaceSummary(): Promise<WorkspaceSummary> {
      if (useMock) return getMockWorkspaceSummary();
      try {
        return await getAction<WorkspaceSummary>("workspace-summary");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("getScrimWorkspaceSummary is not defined")) {
          return buildWorkspaceSummaryFallback();
        }
        throw error;
      }
    },
    async getUploadDialogData(): Promise<UploadDialogData> {
      if (useMock) return getMockUploadDialogData();
      return getAction<UploadDialogData>("upload-dialog");
    },
    async getPendingReviewList(): Promise<ReviewListItem[]> {
      if (useMock) return getMockPendingReviewList();
      return getAction<ReviewListItem[]>("review-list");
    },
    async getPendingReviewDetail(matchId: string): Promise<ReviewDetailData> {
      if (useMock) return getMockPendingReviewDetail(matchId);
      return getAction<ReviewDetailData>("review-detail", { matchId });
    },
    async getScheduleDialogData(): Promise<ScheduleDialogData> {
      if (useMock) return getMockScheduleDialogData();
      return getAction<ScheduleDialogData>("schedule-dialog");
    },
    async getPlannedMatchForEdit(scheduleId: string): Promise<PlannedMatchEditData> {
      if (useMock) return getMockPlannedMatchForEdit(scheduleId);
      return getAction<PlannedMatchEditData>("planned-match", { scheduleId });
    },
    async getManualBpMatchInfo(matchId: string): Promise<UploadMatchDetail> {
      if (useMock) return getMockManualBpMatchInfo(matchId);
      return getAction<UploadMatchDetail>("upload-match", { matchId });
    },
    async submitScrimUploadDialog(payload: SubmitUploadPayload): Promise<SubmitUploadResult> {
      if (useMock) return submitMockUpload(payload);
      return postAction<SubmitUploadResult>("submit-upload", payload);
    },
    async saveManualBp(payload: SaveManualBpPayload): Promise<SaveManualBpResult> {
      if (useMock) return saveMockManualBp(payload);
      return postAction<SaveManualBpResult>("save-manual-bp", payload);
    },
    async savePendingReview(payload: SavePendingReviewPayload): Promise<SavePendingReviewResult> {
      if (useMock) return saveMockPendingReview(payload);
      return postAction<SavePendingReviewResult>("save-review", payload);
    },
    async approvePendingReview(payload: SavePendingReviewPayload): Promise<SavePendingReviewResult> {
      if (useMock) return approveMockPendingReview(payload);
      return postAction<SavePendingReviewResult>("approve-review", payload);
    },
    async savePlannedMatch(payload: SavePlannedMatchPayload): Promise<SavePlannedMatchResult> {
      if (useMock) return saveMockPlannedMatch(payload);
      return postAction<SavePlannedMatchResult>("save-planned-match", payload);
    },
  };
}
