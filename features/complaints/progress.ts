export const PROGRESS_STAGES = ["접수", "처리중", "완료"] as const;
export type ProgressStage = (typeof PROGRESS_STAGES)[number];

/** 접수 = 임대인이 아직 확인 전, 처리중 = 확인했지만 해결 전, 완료 = 해결됨. */
export function progressStage(c: {
  confirmedAt: string | null;
  resolvedAt: string | null;
}): ProgressStage {
  if (c.resolvedAt) return "완료";
  if (c.confirmedAt) return "처리중";
  return "접수";
}

export function countByStage(
  complaints: { confirmedAt: string | null; resolvedAt: string | null }[],
): Record<ProgressStage, number> {
  const counts: Record<ProgressStage, number> = { 접수: 0, 처리중: 0, 완료: 0 };
  for (const c of complaints) counts[progressStage(c)] += 1;
  return counts;
}
