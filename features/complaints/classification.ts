export const PROBLEM_TYPES = [
  "누수",
  "난방·온수",
  "전기",
  "곰팡이",
  "배수",
  "도어락·창호",
  "기타",
] as const;

export const FACILITIES = [
  "욕실",
  "주방",
  "보일러·온수기",
  "현관·도어락",
  "창문",
  "거실·방",
  "공용부",
  "기타·불명",
] as const;

export const URGENCIES = ["긴급", "보통", "낮음"] as const;

export type ProblemType = (typeof PROBLEM_TYPES)[number];
export type Facility = (typeof FACILITIES)[number];
export type Urgency = (typeof URGENCIES)[number];

export const URGENCY_DEFINITIONS: Record<Urgency, string> = {
  긴급: "안전 위험이나 생활 불능 (예: 가스 냄새, 전체 정전, 난방 중단)",
  보통: "불편하지만 당장 위험은 없음",
  낮음: "미관이나 경미한 불편",
};

/** 분류기가 돌려주는 결과. 임시 분류기와 AI 모델이 같은 모양을 따른다. */
export type Classification = {
  problemType: ProblemType;
  facility: Facility;
  urgency: Urgency;
  needsReview: boolean;
  multipleIssues: boolean;
};

/** 분류에 실패한 민원은 세 값이 모두 null이다. */
export type StoredClassification = {
  problemType: ProblemType | null;
  facility: Facility | null;
  urgency: Urgency | null;
  needsReview: boolean;
  multipleIssues: boolean;
};

export type StoredComplaint = StoredClassification & {
  id: string;
  body: string;
  createdAt: string;
};

const URGENCY_RANK: Record<Urgency, number> = { 긴급: 0, 보통: 1, 낮음: 2 };

/** 분류되지 않은 민원은 보통과 같은 순서로 다룬다. */
export function urgencyRank(urgency: Urgency | null): number {
  return URGENCY_RANK[urgency ?? "보통"];
}

export function sortByUrgency<T extends StoredComplaint>(complaints: T[]): T[] {
  return [...complaints].sort(
    (a, b) =>
      urgencyRank(a.urgency) - urgencyRank(b.urgency) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}
