import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { draftSlots } from "../constants";
import type {
  ChampionOption,
  DraftEntry,
  SaveManualBpPayload,
  UploadDialogData,
  UploadMatchDetail,
} from "../types";

type UploadTabProps = {
  data: UploadDialogData | null;
  loading: boolean;
  loadError: string;
  onRefresh: () => Promise<void>;
  onLoadMatch: (matchId: string) => Promise<UploadMatchDetail>;
  onSubmitImages: (payload: {
    matchChoice: string;
    minute15Image: string;
    resultImage: string;
    minute15NoImage?: boolean;
    resultNoImage?: boolean;
  }) => Promise<{ matchId: string; updatedKinds: string[] }>;
  onSaveBp: (payload: SaveManualBpPayload) => Promise<{ matchId: string; rows: number }>;
};

function createEmptyDraftEntries(): DraftEntry[] {
  return draftSlots.map(() => ({ champion: "" }));
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

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function findChampionMatches(query: string, champions: ChampionOption[]) {
  const text = normalizeSearchText(query);
  if (!text) return [];

  const startsWithMatches = champions.filter((option) => {
    const jp = normalizeSearchText(option.champion);
    const aliases = (option.alias ?? []).map(normalizeSearchText);
    return jp.startsWith(text) || aliases.some((alias) => alias.startsWith(text));
  });
  if (startsWithMatches.length) return startsWithMatches;

  return champions.filter((option) => {
    const jp = normalizeSearchText(option.champion);
    const aliases = (option.alias ?? []).map(normalizeSearchText);
    return jp.includes(text) || aliases.some((alias) => alias.includes(text));
  });
}

function extractMatchIdFromChoice(matchChoice: string) {
  const parts = matchChoice.split("|");
  const lastPart = parts.length ? parts[parts.length - 1] : "";
  return lastPart.trim();
}

export function UploadTab({
  data,
  loading,
  loadError,
  onRefresh,
  onLoadMatch,
  onSubmitImages,
  onSaveBp,
}: UploadTabProps) {
  const candidates = data?.candidates ?? [];
  const champions = data?.champions ?? [];

  const [selectedChoice, setSelectedChoice] = useState("");
  const [matchId, setMatchId] = useState("");
  const [matchDetail, setMatchDetail] = useState<UploadMatchDetail | null>(null);
  const [draftEntries, setDraftEntries] = useState<DraftEntry[]>(createEmptyDraftEntries);
  const [draftIndex, setDraftIndex] = useState(0);
  const [draftInput, setDraftInput] = useState("");
  const [blueTeamName, setBlueTeamName] = useState("");
  const [redTeamName, setRedTeamName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [minute15NoImage, setMinute15NoImage] = useState(false);
  const [resultNoImage, setResultNoImage] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const minute15InputRef = useRef<HTMLInputElement | null>(null);
  const resultInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!candidates.length) return;
    setSelectedChoice((current) => current || candidates[0].label);
    setMatchId((current) => current || candidates[0].matchId);
  }, [candidates]);

  useEffect(() => {
    const nextMatchId = extractMatchIdFromChoice(selectedChoice);
    if (nextMatchId) setMatchId(nextMatchId);
  }, [selectedChoice]);

  useEffect(() => {
    const nextDraftIndex = draftEntries.findIndex((entry) => !entry.champion.trim());
    setDraftIndex(nextDraftIndex === -1 ? draftEntries.length : nextDraftIndex);
  }, [draftEntries]);

  useEffect(() => {
    const currentChampion = draftEntries[draftIndex]?.champion ?? "";
    setDraftInput(currentChampion);
  }, [draftEntries, draftIndex]);

  const teams = useMemo(() => {
    if (!matchDetail) return [];
    return [matchDetail.team1Name, matchDetail.team2Name].filter(Boolean);
  }, [matchDetail]);

  const currentSlot = draftSlots[draftIndex] ?? null;

  async function handleLoadMatch() {
    if (!matchId.trim()) {
      setStatus("試合IDを入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      const detail = await onLoadMatch(matchId.trim());
      setMatchDetail(detail);
      setBlueTeamName(detail.blueTeamName || detail.team1Name);
      setRedTeamName(detail.redTeamName || detail.team2Name);

      const nextEntries = createEmptyDraftEntries();
      for (const row of detail.existingBp ?? []) {
        const index = draftSlots.findIndex((slot) => slot.order === row.bpOrder);
        if (index >= 0) nextEntries[index] = { champion: row.championName || "" };
      }

      setDraftEntries(nextEntries);
      setStatus("試合情報を読み込みました。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleApplyDraft() {
    if (!currentSlot) return;

    const raw = draftInput.trim();
    if (!raw) return;

    const matches = findChampionMatches(raw, champions);
    if (!matches.length) {
      setStatus(`候補が見つかりません: ${raw}`);
      return;
    }
    if (matches.length > 1) {
      setStatus(`候補が複数あります: ${matches.map((match) => match.champion).join(", ")}`);
      return;
    }

    setDraftEntries((current) =>
      current.map((entry, index) => (index === draftIndex ? { champion: matches[0].champion } : entry)),
    );
    setStatus(`${matches[0].champion} を入力しました。`);
  }

  function handleDraftKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleApplyDraft();
  }

  function handleMoveBack() {
    if (draftIndex <= 0) return;
    setDraftIndex((current) => Math.max(0, current - 1));
  }

  function handleClearDraft() {
    setDraftEntries(createEmptyDraftEntries());
    setDraftIndex(0);
    setDraftInput("");
  }

  async function handleSubmitImages() {
    if (!selectedChoice) {
      setStatus("対象試合を選択してください。");
      return;
    }

    setSubmitting(true);
    try {
      const minute15Image = await fileToDataUrl(minute15InputRef.current?.files?.[0] ?? null);
      const resultImage = await fileToDataUrl(resultInputRef.current?.files?.[0] ?? null);
      const response = await onSubmitImages({
        matchChoice: selectedChoice,
        minute15Image,
        resultImage,
        minute15NoImage,
        resultNoImage,
      });

      if (minute15InputRef.current) minute15InputRef.current.value = "";
      if (resultInputRef.current) resultInputRef.current.value = "";
      setMinute15NoImage(false);
      setResultNoImage(false);

      setStatus(`画像を送信しました。試合ID: ${response.matchId} / 更新: ${response.updatedKinds.join(", ")}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveBp() {
    if (!matchId.trim()) {
      setStatus("試合IDを入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      const payload: SaveManualBpPayload = {
        matchId: matchId.trim(),
        blueTeamName,
        redTeamName,
        imageUrl: imageUrl.trim(),
        note: note.trim(),
        bans: { BLUE: [], RED: [] },
        picks: { BLUE: [], RED: [] },
      };

      draftSlots.forEach((slot, index) => {
        const championName = draftEntries[index]?.champion?.trim() ?? "";
        if (slot.type === "BAN") {
          payload.bans[slot.side].push({ championName, note: "" });
          return;
        }
        payload.picks[slot.side].push({ role: "", championName, note: "" });
      });

      const response = await onSaveBp(payload);
      setStatus(`BPを保存しました。試合ID: ${response.matchId} / 行数: ${response.rows}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  function renderPreview(side: "BLUE" | "RED") {
    const lines = draftSlots
      .map((slot, index) => ({ slot, champion: draftEntries[index]?.champion?.trim() ?? "" }))
      .filter(({ slot, champion }) => slot.side === side && champion)
      .map(({ slot, champion }) => `${slot.label} | ${champion}`);

    return lines.length ? lines.join("\n") : "未入力";
  }

  return (
    <section className="workspace-section">
      <div className="section-toolbar">
        <div>
          <h2>スクショ提出</h2>
          <p className="section-copy">
            対象試合の画像提出と BP の追加入力をこの画面で行います。
          </p>
        </div>
        <button type="button" className="ghost-button" onClick={() => void onRefresh()} disabled={loading}>
          候補を再読込
        </button>
      </div>

      <div className="content-grid content-grid-upload">
        <article className="workspace-card">
          <div className="field-grid">
            <label className="field">
              <span>対象試合</span>
              <select value={selectedChoice} onChange={(event) => setSelectedChoice(event.target.value)}>
                {candidates.map((candidate) => (
                  <option key={candidate.matchId} value={candidate.label}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>試合ID</span>
              <input value={matchId} onChange={(event) => setMatchId(event.target.value)} />
            </label>
          </div>

          <div className="button-row">
            <button type="button" className="ghost-button" onClick={() => void handleLoadMatch()} disabled={submitting}>
              試合情報を読込
            </button>
            <button type="button" className="primary-button" onClick={() => void handleSubmitImages()} disabled={submitting}>
              画像を送信
            </button>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>15分画像</span>
              <input ref={minute15InputRef} type="file" accept="image/*" disabled={minute15NoImage} />
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={minute15NoImage}
                  onChange={(event) => {
                    setMinute15NoImage(event.target.checked);
                    if (event.target.checked && minute15InputRef.current) minute15InputRef.current.value = "";
                  }}
                />
                <span>画像なし（スプシに「-」を保存）</span>
              </label>
            </label>
            <label className="field">
              <span>リザルト画像</span>
              <input ref={resultInputRef} type="file" accept="image/*" disabled={resultNoImage} />
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={resultNoImage}
                  onChange={(event) => {
                    setResultNoImage(event.target.checked);
                    if (event.target.checked && resultInputRef.current) resultInputRef.current.value = "";
                  }}
                />
                <span>画像なし（スプシに「-」を保存）</span>
              </label>
            </label>
          </div>

          <p className="status-text">
            {matchDetail
              ? `${matchDetail.matchDate} / G${matchDetail.matchNo} / ${matchDetail.team1Name} vs ${matchDetail.team2Name}`
              : "試合情報はまだ読み込まれていません。"}
          </p>
          {loadError ? <p className="error-text">読込エラー: {loadError}</p> : null}
        </article>

        <article className="workspace-card">
          <h3>BP保存メタ情報</h3>

          <div className="field-grid">
            <label className="field">
              <span>BLUEチーム</span>
              <select value={blueTeamName} onChange={(event) => setBlueTeamName(event.target.value)}>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>REDチーム</span>
              <select value={redTeamName} onChange={(event) => setRedTeamName(event.target.value)}>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>画像URL / メモURL</span>
            <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
          </label>

          <label className="field">
            <span>修正メモ</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
        </article>
      </div>

      <div className="content-grid content-grid-upload">
        <article className="workspace-card">
          <div className="draft-step-card">
            <p className="draft-title">BP単一入力</p>
            <strong className="draft-step">
              {currentSlot ? (
                <>
                  次の入力:{" "}
                  <span className={currentSlot.side === "BLUE" ? "side-blue" : "side-red"}>
                    {currentSlot.side}
                  </span>{" "}
                  {currentSlot.label.replace(currentSlot.side, "")}
                </>
              ) : (
                "BP入力は完了済み"
              )}
            </strong>
            <p className="section-copy">
              {currentSlot
                ? `${currentSlot.type} を入力して Enter か確定で進めます。`
                : "必要なら 1つ戻る か クリア で修正できます。"}
            </p>
          </div>

          <div className="draft-input-row">
            <label className="field">
              <span>チャンピオン</span>
              <input
                list="champion-options"
                value={draftInput}
                onChange={(event) => setDraftInput(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                disabled={!currentSlot}
                placeholder="チャンピオン名を入力"
              />
            </label>
            <button type="button" className="primary-button" onClick={handleApplyDraft} disabled={!currentSlot}>
              確定
            </button>
            <button type="button" className="ghost-button" onClick={handleMoveBack} disabled={draftIndex === 0}>
              1つ戻る
            </button>
          </div>

          <div className="button-row">
            <button type="button" className="ghost-button" onClick={handleClearDraft}>
              クリア
            </button>
            <button type="button" className="ghost-button" onClick={() => void handleSaveBp()} disabled={submitting}>
              BPを保存
            </button>
          </div>

          <datalist id="champion-options">
            {champions.map((champion) => (
              <option key={champion.champion} value={champion.champion} />
            ))}
          </datalist>
        </article>

        <article className="workspace-card">
          <div className="preview-grid">
            <section className="preview-card">
              <h3>
                <span className="side-blue">BLUE</span> BP
              </h3>
              <pre>{renderPreview("BLUE")}</pre>
            </section>

            <section className="preview-card">
              <h3>
                <span className="side-red">RED</span> BP
              </h3>
              <pre>{renderPreview("RED")}</pre>
            </section>
          </div>

          <p className="status-text">{status || "送信結果や保存結果はここに表示されます。"}</p>
        </article>
      </div>
    </section>
  );
}
