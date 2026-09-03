export type MatchTitleType = "movie" | "tv";
export type MatchStatus = "plan_to_watch" | "watching" | "completed" | "on_hold" | "dropped";

export type MatchSignal = {
  titleId: number;
  titleType: MatchTitleType;
  status: MatchStatus;
};

export type TasteMatchResult = {
  matchPercent: number | null;
  sharedTitles: number;
  statusAgreementPercent: number;
  overlapCoveragePercent: number;
  confidence: "کم" | "متوسط" | "بالا";
  recommendations: MatchSignal[];
};

const STATUS_SCORE: Record<MatchStatus, number> = {
  dropped: 1,
  on_hold: 2,
  plan_to_watch: 3,
  watching: 4,
  completed: 5,
};

function key(signal: Pick<MatchSignal, "titleId" | "titleType">) {
  return `${signal.titleType}:${signal.titleId}`;
}

export function computeTasteMatch(viewer: MatchSignal[], otherPublic: MatchSignal[]): TasteMatchResult {
  const viewerMap = new Map(viewer.map((item) => [key(item), item]));
  const otherMap = new Map(otherPublic.map((item) => [key(item), item]));
  const shared = [...viewerMap.entries()]
    .filter(([identity]) => otherMap.has(identity))
    .map(([identity, mine]) => ({ mine, theirs: otherMap.get(identity)! }));

  const agreements = shared.map(({ mine, theirs }) =>
    1 - Math.abs(STATUS_SCORE[mine.status] - STATUS_SCORE[theirs.status]) / 4,
  );
  const statusAgreement = agreements.length
    ? agreements.reduce((sum, value) => sum + value, 0) / agreements.length
    : 0;
  const smallerSample = Math.max(1, Math.min(viewerMap.size, otherMap.size));
  const coverage = Math.min(1, shared.length / smallerSample);
  const confidenceFactor = Math.min(1, shared.length / 8);
  const confidence = shared.length >= 8 ? "بالا" : shared.length >= 5 ? "متوسط" : "کم";

  const matchPercent = shared.length < 3
    ? null
    : Math.round(
        Math.max(0, Math.min(1, statusAgreement * 0.65 + coverage * 0.35)) *
          (0.6 + confidenceFactor * 0.4) *
          100,
      );

  const recommendations = otherPublic
    .filter((item) => !viewerMap.has(key(item)) && (item.status === "completed" || item.status === "watching"))
    .sort((a, b) => STATUS_SCORE[b.status] - STATUS_SCORE[a.status] || a.titleId - b.titleId)
    .slice(0, 12);

  return {
    matchPercent,
    sharedTitles: shared.length,
    statusAgreementPercent: Math.round(statusAgreement * 100),
    overlapCoveragePercent: Math.round(coverage * 100),
    confidence,
    recommendations,
  };
}
