import {
  urgencyRank,
  type Classification,
  type Facility,
  type ProblemType,
  type Urgency,
} from "./classification";

// 임시 분류기: AI 모델 대신 키워드 규칙으로 분류한다. 같은 Classification 모양을 따른다.

const PROBLEM_KEYWORDS: Record<Exclude<ProblemType, "기타">, string[]> = {
  누수: ["누수", "물이 새", "물이 샌", "샌다", "새요", "물샘", "물이 떨어", "천장에서 물"],
  "난방·온수": ["난방", "온수", "보일러", "뜨거운 물", "따뜻한 물"],
  전기: ["전기", "정전", "누전", "콘센트", "전등", "차단기", "합선", "감전"],
  곰팡이: ["곰팡"],
  배수: ["배수", "막혔", "막혀", "하수구", "역류", "물이 안 내려", "물이 안 빠"],
  "도어락·창호": ["도어락", "현관문", "창호", "방충망", "잠기지", "안 잠", "창문이 안"],
};

const FACILITY_KEYWORDS: Record<Exclude<Facility, "기타·불명">, string[]> = {
  욕실: ["욕실", "화장실", "샤워", "세면대", "변기"],
  주방: ["주방", "싱크대", "부엌"],
  "보일러·온수기": ["보일러", "온수기"],
  "현관·도어락": ["현관", "도어락"],
  창문: ["창문", "창호", "베란다"],
  "거실·방": ["거실", "안방", "침실", "방 "],
  공용부: ["복도", "엘리베이터", "공용", "계단", "주차장"],
};

const URGENT_KEYWORDS = [
  "가스",
  "연기",
  "불이",
  "감전",
  "합선",
  "정전",
  "물바다",
  "쏟아",
  "갇혔",
  "난방이 안",
  "난방 안",
  "난방이 전혀",
];
const LOW_KEYWORDS = ["흠집", "얼룩", "조금", "살짝", "미관", "페인트", "긁힘"];

function matches(text: string, keywords: string[]): number {
  const indexes = keywords.map((k) => text.indexOf(k)).filter((i) => i >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
}

function urgencyOf(text: string): Urgency {
  if (URGENT_KEYWORDS.some((k) => text.includes(k))) return "긴급";
  if (LOW_KEYWORDS.some((k) => text.includes(k))) return "낮음";
  return "보통";
}

function clauseContaining(text: string, index: number): string {
  const clauses = text.split(/(?<=[.!?\n])|(?<=그리고)/);
  let offset = 0;
  for (const clause of clauses) {
    if (index < offset + clause.length) return clause;
    offset += clause.length;
  }
  return text;
}

export function stubClassify(text: string): Classification {
  const found = (
    Object.entries(PROBLEM_KEYWORDS) as [ProblemType, string[]][]
  )
    .map(([type, keywords]) => ({ type, index: matches(text, keywords) }))
    .filter((m) => m.index >= 0);

  if (found.length === 0) {
    return {
      problemType: "기타",
      facility: facilityOf(text),
      urgency: urgencyOf(text),
      needsReview: true,
      multipleIssues: false,
    };
  }

  // 여러 문제면 가장 긴급한 문제를 기준으로 고르고, 같으면 먼저 언급된 문제를 고른다.
  const ranked = found
    .map((m) => ({
      ...m,
      clause: clauseContaining(text, m.index),
      urgency: urgencyOf(clauseContaining(text, m.index)),
    }))
    .sort(
      (a, b) =>
        urgencyRank(a.urgency) - urgencyRank(b.urgency) || a.index - b.index,
    );
  const chosen = ranked[0];
  const facility = facilityOf(chosen.clause, text);
  const multipleIssues = found.length > 1;

  return {
    problemType: chosen.type,
    facility,
    urgency: chosen.urgency,
    needsReview: multipleIssues || facility === "기타·불명",
    multipleIssues,
  };
}

function facilityOf(primary: string, fallback = primary): Facility {
  for (const text of [primary, fallback]) {
    const hit = (
      Object.entries(FACILITY_KEYWORDS) as [Facility, string[]][]
    )
      .map(([facility, keywords]) => ({
        facility,
        index: matches(text, keywords),
      }))
      .filter((m) => m.index >= 0)
      .sort((a, b) => a.index - b.index)[0];
    if (hit) return hit.facility;
  }
  return "기타·불명";
}
