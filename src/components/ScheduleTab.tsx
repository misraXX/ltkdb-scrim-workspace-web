import { useEffect, useState } from "react";
import type {
  PlannedMatchEditData,
  SavePlannedMatchPayload,
  SavePlannedMatchResult,
  ScheduleDialogData,
} from "../types";

type ScheduleTabProps = {
  data: ScheduleDialogData | null;
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
  onLoadSchedule: (scheduleId: string) => Promise<PlannedMatchEditData>;
  onSave: (payload: SavePlannedMatchPayload) => Promise<SavePlannedMatchResult>;
};

type ScheduleFormState = {
  editMode: "create" | "update";
  scheduleId: string;
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
  gameCount: string;
  sourceImage: string;
  memo: string;
};

type TeamSide = "left" | "right";

function createInitialState(data: ScheduleDialogData | null): ScheduleFormState {
  return {
    editMode: "create",
    scheduleId: "",
    eventDate: data?.defaultDate ?? "",
    eventTime: "",
    dayLabel: "",
    matchType: data?.matchTypes[0] ?? "スクリム",
    stage: data?.stages[0] ?? "Regular",
    tier: data?.tiers[0] ?? "NEXT",
    leftTeamKey: data?.teams[0]?.key ?? "",
    rightTeamKey: data?.teams[1]?.key ?? data?.teams[0]?.key ?? "",
    blueTeamKey: data?.teams[0]?.key ?? "",
    redTeamKey: data?.teams[1]?.key ?? data?.teams[0]?.key ?? "",
    gameCount: "3",
    sourceImage: "",
    memo: "",
  };
}

function csvToList(value?: string) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function teamKeyForSide(form: ScheduleFormState, side: TeamSide) {
  return side === "left" ? form.leftTeamKey : form.rightTeamKey;
}

function oppositeSide(side: TeamSide): TeamSide {
  return side === "left" ? "right" : "left";
}

function sideForTeamKey(form: ScheduleFormState, teamKey: string): TeamSide {
  return teamKey === form.rightTeamKey && teamKey !== form.leftTeamKey ? "right" : "left";
}

export function ScheduleTab({ data, loading, error, onRefresh, onLoadSchedule, onSave }: ScheduleTabProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [form, setForm] = useState<ScheduleFormState>(createInitialState(data));
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((current) => {
      const next = createInitialState(data);
      return {
        ...next,
        ...current,
        eventDate: current.eventDate || next.eventDate,
        matchType: current.matchType || next.matchType,
        stage: current.stage || next.stage,
        tier: current.tier || next.tier,
        leftTeamKey: current.leftTeamKey || next.leftTeamKey,
        rightTeamKey: current.rightTeamKey || next.rightTeamKey,
        blueTeamKey: current.blueTeamKey || next.blueTeamKey,
        redTeamKey: current.redTeamKey || next.redTeamKey,
      };
    });
  }, [data]);

  function updateField<K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function firstDifferentTeamKey(teamKey: string) {
    return data?.teams.find((team) => team.key !== teamKey)?.key ?? teamKey;
  }

  function updateLeftTeamKey(value: string) {
    setForm((current) => {
      const blueSide = sideForTeamKey(current, current.blueTeamKey);
      const nextRightTeamKey = current.rightTeamKey === value ? firstDifferentTeamKey(value) : current.rightTeamKey;
      return {
        ...current,
        leftTeamKey: value,
        rightTeamKey: nextRightTeamKey,
        blueTeamKey: blueSide === "left" ? value : nextRightTeamKey,
        redTeamKey: blueSide === "left" ? nextRightTeamKey : value,
      };
    });
  }

  function updateRightTeamKey(value: string) {
    setForm((current) => {
      const blueSide = sideForTeamKey(current, current.blueTeamKey);
      const nextLeftTeamKey = current.leftTeamKey === value ? firstDifferentTeamKey(value) : current.leftTeamKey;
      return {
        ...current,
        leftTeamKey: nextLeftTeamKey,
        rightTeamKey: value,
        blueTeamKey: blueSide === "left" ? nextLeftTeamKey : value,
        redTeamKey: blueSide === "left" ? value : nextLeftTeamKey,
      };
    });
  }

  function updateBlueSide(side: TeamSide) {
    const redSide = oppositeSide(side);
    setForm((current) => ({
      ...current,
      blueTeamKey: teamKeyForSide(current, side),
      redTeamKey: teamKeyForSide(current, redSide),
    }));
  }

  function updateRedSide(side: TeamSide) {
    const blueSide = oppositeSide(side);
    setForm((current) => ({
      ...current,
      blueTeamKey: teamKeyForSide(current, blueSide),
      redTeamKey: teamKeyForSide(current, side),
    }));
  }

  async function handleLoadSchedule() {
    if (!selectedScheduleId) {
      setStatus("既存予定を選択してください。");
      return;
    }

    setSubmitting(true);
    try {
      const detail = await onLoadSchedule(selectedScheduleId);
      setForm({
        editMode: "update",
        scheduleId: detail.schedule_id ?? selectedScheduleId,
        eventDate: (detail.event_date ?? "").replace(/\//g, "-"),
        eventTime: detail.event_time ?? "",
        dayLabel: detail.day_label ?? "",
        matchType: detail.match_type ?? "",
        stage: detail.stage ?? "",
        tier: detail.tier ?? "",
        leftTeamKey: detail.left_team_key ?? "",
        rightTeamKey: detail.right_team_key ?? "",
        blueTeamKey: detail.blue_team_key ?? detail.left_team_key ?? "",
        redTeamKey: detail.red_team_key ?? detail.right_team_key ?? "",
        gameCount: detail.result_count ?? String(csvToList(detail.linked_result_ids).length || 1),
        sourceImage: detail.source_image ?? "",
        memo: detail.memo ?? "",
      });
      setStatus("既存予定を読み込みました。");
    } catch (loadError) {
      setStatus(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(createInitialState(data));
    setSelectedScheduleId("");
    setStatus("");
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      const payload: SavePlannedMatchPayload = {
        editMode: form.editMode,
        scheduleId: form.scheduleId || undefined,
        eventDate: form.eventDate,
        eventTime: form.eventTime,
        dayLabel: form.dayLabel,
        matchType: form.matchType,
        stage: form.stage,
        tier: form.tier,
        leftTeamKey: form.leftTeamKey,
        rightTeamKey: form.rightTeamKey,
        blueTeamKey: form.blueTeamKey,
        redTeamKey: form.redTeamKey,
        gameCount: Number(form.gameCount || 1),
        sourceImage: form.sourceImage,
        memo: form.memo,
      };

      const result = await onSave(payload);
      setForm((current) => ({
        ...current,
        editMode: "update",
        scheduleId: result.scheduleId,
      }));
      setSelectedScheduleId(result.scheduleId);
      setStatus(`保存しました。schedule_id: ${result.scheduleId} / 試合ID: ${result.resultIds.join(", ")}`);
      await onRefresh();
    } catch (saveError) {
      setStatus(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="workspace-section">
      <div className="section-toolbar">
        <div>
          <h2>予定と試合ID発行</h2>
          <p className="section-copy">新規予定の登録と既存予定の読込・更新をこのタブで行います。</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => void onRefresh()} disabled={loading}>
          候補を再読込
        </button>
      </div>

      <article className="workspace-card">
        {loading ? <p className="status-text">読み込み中...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && !error && data ? (
          <>
            <div className="field-grid">
              <label className="field">
                <span>既存予定</span>
                <select value={selectedScheduleId} onChange={(event) => setSelectedScheduleId(event.target.value)}>
                  <option value="">新規登録</option>
                  {data.schedules.map((schedule) => (
                    <option key={schedule.scheduleId} value={schedule.scheduleId}>
                      {schedule.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>モード</span>
                <input value={form.editMode === "update" ? "更新" : "新規"} readOnly />
              </label>
            </div>

            <div className="button-row">
              <button type="button" className="ghost-button" onClick={() => void handleLoadSchedule()} disabled={submitting}>
                既存予定を読込
              </button>
              <button type="button" className="ghost-button" onClick={handleReset} disabled={submitting}>
                新規入力に戻す
              </button>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>イベント日</span>
                <input type="date" value={form.eventDate} onChange={(event) => updateField("eventDate", event.target.value)} />
              </label>
              <label className="field">
                <span>開始時刻</span>
                <input value={form.eventTime} onChange={(event) => updateField("eventTime", event.target.value)} placeholder="19:00" />
              </label>
              <label className="field">
                <span>DAY表記</span>
                <input value={form.dayLabel} onChange={(event) => updateField("dayLabel", event.target.value)} placeholder="DAY 1" />
              </label>
              <label className="field">
                <span>試合種別</span>
                <select value={form.matchType} onChange={(event) => updateField("matchType", event.target.value)}>
                  {data.matchTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>ステージ</span>
                <select value={form.stage} onChange={(event) => updateField("stage", event.target.value)}>
                  {data.stages.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>tier</span>
                <select value={form.tier} onChange={(event) => updateField("tier", event.target.value)}>
                  {data.tiers.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>左チーム</span>
                <select value={form.leftTeamKey} onChange={(event) => updateLeftTeamKey(event.target.value)}>
                  {data.teams.map((team) => (
                    <option key={team.key} value={team.key}>
                      {team.shortName} | {team.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>右チーム</span>
                <select value={form.rightTeamKey} onChange={(event) => updateRightTeamKey(event.target.value)}>
                  {data.teams.map((team) => (
                    <option key={team.key} value={team.key}>
                      {team.shortName} | {team.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>BLUEチーム</span>
                <select value={sideForTeamKey(form, form.blueTeamKey)} onChange={(event) => updateBlueSide(event.target.value as TeamSide)}>
                  <option value="left">左チーム | {form.leftTeamKey || "未入力"}</option>
                  <option value="right">右チーム | {form.rightTeamKey || "未入力"}</option>
                </select>
              </label>
              <label className="field">
                <span>REDチーム</span>
                <select value={sideForTeamKey(form, form.redTeamKey)} onChange={(event) => updateRedSide(event.target.value as TeamSide)}>
                  <option value="left">左チーム | {form.leftTeamKey || "未入力"}</option>
                  <option value="right">右チーム | {form.rightTeamKey || "未入力"}</option>
                </select>
              </label>
              <label className="field">
                <span>試合数</span>
                <input value={form.gameCount} onChange={(event) => updateField("gameCount", event.target.value)} />
              </label>
              <label className="field">
                <span>source_image</span>
                <input value={form.sourceImage} onChange={(event) => updateField("sourceImage", event.target.value)} />
              </label>
            </div>

            <label className="field">
              <span>メモ</span>
              <textarea value={form.memo} onChange={(event) => updateField("memo", event.target.value)} />
            </label>

            <div className="button-row">
              <button type="button" className="primary-button" onClick={() => void handleSave()} disabled={submitting}>
                予定と試合IDを保存
              </button>
            </div>

            <p className="status-text">{status || "保存結果はここに表示されます。"}</p>
          </>
        ) : null}
      </article>
    </section>
  );
}
