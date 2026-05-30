import { draftSlots } from "./constants";
import type {
  ChampionOption,
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
  WorkspaceSummary,
} from "./types";

const champions: ChampionOption[] = [
  { champion: "アーリ", alias: ["ahri"] },
  { champion: "アカリ", alias: ["akali"] },
  { champion: "オリアナ", alias: ["orianna"] },
  { champion: "オーン", alias: ["ornn"] },
  { champion: "グウェン", alias: ["gwen"] },
  { champion: "サイラス", alias: ["sylas"] },
  { champion: "ジャーヴァンIV", alias: ["jarvan", "jarvaniv", "j4"] },
  { champion: "ゼリ", alias: ["zeri"] },
  { champion: "ティーモ", alias: ["teemo"] },
  { champion: "ナー", alias: ["gnar"] },
  { champion: "ミリオ", alias: ["milio"] },
  { champion: "ラカン", alias: ["rakan"] },
  { champion: "ルシアン", alias: ["lucian"] },
  { champion: "悟空", alias: ["wukong"] },
];

const uploadCandidates = [
  {
    matchId: "SCRIM_20260530_CORE_IT_DD_001",
    label: "2026/05/30 | Iris Tiara Core vs Dahlia Diadem Core | Game1 | SCRIM_20260530_CORE_IT_DD_001",
  },
  {
    matchId: "SCRIM_20260530_CORE_IT_DD_002",
    label: "2026/05/30 | Iris Tiara Core vs Dahlia Diadem Core | Game2 | SCRIM_20260530_CORE_IT_DD_002",
  },
  {
    matchId: "SCRIM_20260530_NEXT_LR_CC_001",
    label: "2026/05/30 | Laurel Regalia Next vs Camellia Crown Next | Game1 | SCRIM_20260530_NEXT_LR_CC_001",
  },
];

const uploadDetails: Record<string, UploadMatchDetail> = {
  SCRIM_20260530_CORE_IT_DD_001: {
    matchId: "SCRIM_20260530_CORE_IT_DD_001",
    matchDate: "2026/05/30",
    matchNo: "1",
    team1Name: "Iris Tiara Core",
    team2Name: "Dahlia Diadem Core",
    blueTeamName: "Iris Tiara Core",
    redTeamName: "Dahlia Diadem Core",
    existingBp: [],
  },
  SCRIM_20260530_CORE_IT_DD_002: {
    matchId: "SCRIM_20260530_CORE_IT_DD_002",
    matchDate: "2026/05/30",
    matchNo: "2",
    team1Name: "Iris Tiara Core",
    team2Name: "Dahlia Diadem Core",
    blueTeamName: "Dahlia Diadem Core",
    redTeamName: "Iris Tiara Core",
    existingBp: draftSlots.slice(0, 4).map((slot, index) => ({
      bpOrder: slot.order,
      championName: ["アーリ", "悟空", "ゼリ", "オーン"][index] ?? "",
    })),
  },
  SCRIM_20260530_NEXT_LR_CC_001: {
    matchId: "SCRIM_20260530_NEXT_LR_CC_001",
    matchDate: "2026/05/30",
    matchNo: "1",
    team1Name: "Laurel Regalia Next",
    team2Name: "Camellia Crown Next",
    blueTeamName: "Laurel Regalia Next",
    redTeamName: "Camellia Crown Next",
    existingBp: [],
  },
};

const mockScheduleEditData: PlannedMatchEditData = {
  schedule_id: "SCH_20260530_001",
  event_date: "2026/05/30",
  event_time: "19:00",
  day_label: "DAY 1",
  match_type: "スクリム",
  stage: "Regular",
  tier: "CORE",
  left_team_key: "IT",
  right_team_key: "DD",
  blue_team_key: "IT",
  red_team_key: "DD",
  source_image: "",
  memo: "",
  linked_result_ids: "SCRIM_20260530_CORE_IT_DD_001,SCRIM_20260530_CORE_IT_DD_002",
};

function extractMatchIdFromChoice(matchChoice: string) {
  const parts = matchChoice.split("|");
  const lastPart = parts.length ? parts[parts.length - 1] : "";
  return lastPart.trim() || "UNKNOWN";
}

export async function getMockWorkspaceSummary(): Promise<WorkspaceSummary> {
  return {
    missingScreenshotCount: uploadCandidates.length,
    pendingReviewCount: 2,
  };
}

export async function getMockUploadDialogData(): Promise<UploadDialogData> {
  return {
    candidates: uploadCandidates,
    champions,
  };
}

export async function getMockPendingReviewList(): Promise<ReviewListItem[]> {
  return [
    {
      matchId: "SCRIM_20260530_CORE_IT_DD_001",
      label: "2026/05/30 | Iris Tiara Core vs Dahlia Diadem Core | G1 | 確認待ち | SCRIM_20260530_CORE_IT_DD_001",
    },
    {
      matchId: "SCRIM_20260530_NEXT_LR_CC_001",
      label: "2026/05/30 | Laurel Regalia Next vs Camellia Crown Next | G1 | 確認待ち | SCRIM_20260530_NEXT_LR_CC_001",
    },
  ];
}

export async function getMockPendingReviewDetail(matchId: string): Promise<ReviewDetailData> {
  return {
    matchId,
    summary: {
      試合ID: matchId,
      チーム1名: "Iris Tiara Core",
      チーム2名: "Dahlia Diadem Core",
      勝利チーム: "Iris Tiara Core",
      試合時間: "31:00",
      メモ: "",
    },
    result: [
      ["BLUE", "TOP", "miiii", "アーリ", "3", "1", "8", "92"],
      ["BLUE", "JG", "Killin9Hit", "悟空", "2", "4", "9", "101"],
      ["BLUE", "MID", "アクセル・シリオス", "オリアナ", "1", "3", "7", "118"],
      ["BLUE", "ADC", "こんかね", "ゼリ", "5", "2", "4", "126"],
      ["BLUE", "SUP", "レグルシュ・ライオンハート", "ラカン", "0", "5", "12", "28"],
      ["RED", "TOP", "PLAYER1", "オーン", "1", "6", "2", "104"],
      ["RED", "JG", "PLAYER2", "ジャーヴァンIV", "2", "5", "6", "93"],
      ["RED", "MID", "PLAYER3", "アカリ", "4", "4", "3", "121"],
      ["RED", "ADC", "PLAYER4", "ルシアン", "6", "3", "1", "115"],
      ["RED", "SUP", "PLAYER5", "ミリオ", "0", "7", "10", "24"],
    ].map(([side, role, player, champion, k, d, a, cs15]) => ({
      サイド: side,
      ロール: role,
      プレイヤー名: player,
      チャンピオン名: champion,
      K: k,
      D: d,
      A: a,
      "15分CS": cs15,
    })),
    bp: [],
    options: {
      players: ["miiii", "Killin9Hit", "アクセル・シリオス", "こんかね", "レグルシュ・ライオンハート"],
      champions: champions.map((item) => item.champion),
    },
    counts: {
      reviewIssues: 2,
    },
  };
}

export async function getMockScheduleDialogData(): Promise<ScheduleDialogData> {
  return {
    defaultDate: "2026-05-30",
    schedules: [
      {
        scheduleId: "SCH_20260530_001",
        label: "2026/05/30 | Core | IT vs DD",
      },
    ],
    teams: [
      { key: "IT", name: "Iris Tiara", shortName: "IT" },
      { key: "DD", name: "Dahlia Diadem", shortName: "DD" },
      { key: "LR", name: "Laurel Regalia", shortName: "LR" },
      { key: "CC", name: "Camellia Crown", shortName: "CC" },
      { key: "LISTENER", name: "リスナー", shortName: "リスナー" },
    ],
    tiers: ["NEXT", "CORE", "MASTERS"],
    matchTypes: ["スクリム", "本番"],
    stages: ["RESULT", "Regular", "FINALS"],
  };
}

export async function getMockPlannedMatchForEdit(scheduleId: string): Promise<PlannedMatchEditData> {
  void scheduleId;
  return mockScheduleEditData;
}

export async function getMockManualBpMatchInfo(matchId: string): Promise<UploadMatchDetail> {
  const match = uploadDetails[matchId];
  if (!match) throw new Error(`mock match not found: ${matchId}`);
  return match;
}

export async function submitMockUpload(payload: SubmitUploadPayload): Promise<SubmitUploadResult> {
  const matchId = extractMatchIdFromChoice(payload.matchChoice);
  void payload;
  return {
    ok: true,
    matchId,
    updatedKinds: ["15分", "RESULT"],
  };
}

export async function saveMockManualBp(payload: SaveManualBpPayload): Promise<SaveManualBpResult> {
  void payload;
  return {
    ok: true,
    matchId: payload.matchId,
    rows: 20,
  };
}

export async function saveMockPendingReview(payload: SavePendingReviewPayload): Promise<SavePendingReviewResult> {
  return {
    ok: true,
    matchId: payload.matchId,
  };
}

export async function approveMockPendingReview(payload: SavePendingReviewPayload): Promise<SavePendingReviewResult> {
  return {
    ok: true,
    matchId: payload.matchId,
    playerUpdates: 1,
  };
}

export async function saveMockPlannedMatch(payload: SavePlannedMatchPayload): Promise<SavePlannedMatchResult> {
  return {
    scheduleId: payload.scheduleId || "SCH_20260530_002",
    resultIds:
      payload.resultIds && payload.resultIds.length
        ? payload.resultIds
        : ["SCRIM_20260530_CORE_IT_DD_003", "SCRIM_20260530_CORE_IT_DD_004"].slice(
            0,
            payload.gameCount,
          ),
    updated: payload.editMode === "update",
  };
}
