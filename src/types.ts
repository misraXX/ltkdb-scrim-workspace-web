export type WorkspaceTab = "schedule" | "upload" | "review";

export type WorkspaceSummary = {
  missingScreenshotCount: number;
  pendingReviewCount: number;
  missingScreenshotError?: string;
  pendingReviewError?: string;
};

export type MatchOption = {
  matchId: string;
  label: string;
};

export type ScheduleOption = {
  scheduleId: string;
  label: string;
};

export type ChampionOption = {
  champion: string;
  alias?: string[];
  iconUrl?: string;
};

export type UploadDialogData = {
  candidates: MatchOption[];
  champions: ChampionOption[];
};

export type WorkspaceBootstrapData = {
  summary: WorkspaceSummary;
  upload: UploadDialogData;
  review: ReviewListItem[];
  schedule: ScheduleDialogData;
};

export type ReviewListItem = {
  matchId: string;
  label: string;
};

export type ReviewDetailData = {
  matchId: string;
  summary: Record<string, string>;
  result: Array<Record<string, string>>;
  bp: Array<Record<string, string>>;
  options: {
    players: string[];
    champions: string[];
  };
  counts: {
    reviewIssues: number;
  };
};

export type SavePendingReviewPayload = {
  matchId: string;
  summary: Record<string, string>;
  result: Array<Record<string, string>>;
  bp: Array<Record<string, string>>;
  resultRecord?: string;
};

export type SavePendingReviewResult = {
  ok: true;
  matchId: string;
  playerUpdates?: number;
};

export type ScheduleDialogData = {
  defaultDate: string;
  schedules: ScheduleOption[];
  teams: { key: string; name: string; shortName: string }[];
  tiers: string[];
  matchTypes: string[];
  stages: string[];
};

export type PlannedMatchEditData = {
  schedule_id?: string;
  source_image?: string;
  event_date?: string;
  event_time?: string;
  match_name?: string;
  day_label?: string;
  match_no?: string;
  match_type?: string;
  stage?: string;
  tier?: string;
  left_team_key?: string;
  right_team_key?: string;
  blue_team_key?: string;
  red_team_key?: string;
  memo?: string;
  linked_result_ids?: string;
  result_count?: string;
  result_record?: string;
  result_status?: string;
};

export type SavePlannedMatchPayload = {
  editMode?: "create" | "update";
  scheduleId?: string;
  eventDate: string;
  eventTime: string;
  dayLabel: string;
  matchType: string;
  stage: string;
  tier: string;
  leftTeamKey: string;
  rightTeamKey: string;
  blueTeamKey: string;
  redTeamKey: string;
  gameCount: number;
  sourceImage: string;
  memo: string;
  resultIds?: string[];
};

export type SavePlannedMatchResult = {
  scheduleId: string;
  resultIds: string[];
  updated?: boolean;
};

export type DraftSide = "BLUE" | "RED";
export type DraftType = "BAN" | "PICK";

export type DraftSlot = {
  side: DraftSide;
  type: DraftType;
  order: number;
  label: string;
};

export type DraftEntry = {
  champion: string;
};

export type ExistingBpRow = {
  bpOrder: number;
  championName: string;
};

export type UploadMatchDetail = {
  matchId: string;
  matchDate: string;
  matchNo: string;
  team1Name: string;
  team2Name: string;
  blueTeamName: string;
  redTeamName: string;
  existingBp: ExistingBpRow[];
};

export type SubmitUploadPayload = {
  matchChoice: string;
  minute15Image: string;
  resultImage: string;
};

export type SubmitUploadResult = {
  ok: true;
  matchId: string;
  updatedKinds: string[];
};

export type SaveManualBpPayload = {
  matchId: string;
  blueTeamName: string;
  redTeamName: string;
  imageUrl: string;
  note: string;
  bans: {
    BLUE: Array<{ championName: string; note: string }>;
    RED: Array<{ championName: string; note: string }>;
  };
  picks: {
    BLUE: Array<{ role: string; championName: string; note: string }>;
    RED: Array<{ role: string; championName: string; note: string }>;
  };
};

export type SaveManualBpResult = {
  ok: true;
  matchId: string;
  rows: number;
};
