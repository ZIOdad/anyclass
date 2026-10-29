import type { Classification, StoredClassification } from "./classification";
import { stubClassify } from "./stub-classifier";

export const MIN_BODY_LENGTH = 4;
export const MAX_BODY_LENGTH = 1000;

export type ComplaintRecord = StoredClassification & {
  body: string;
  /** 분류를 만든 쪽. 임시 분류기는 "stub". */
  classifier: string;
};

export type PrepareResult =
  | { ok: true; record: ComplaintRecord }
  | { ok: false; reason: string };

/**
 * 민원 원문을 검증하고 분류해 저장할 기록을 만든다.
 * 분류가 실패해도 접수는 성립한다: 세 값은 null, 확인 필요로 남긴다.
 */
export function prepareComplaint(
  text: string,
  classify: (text: string) => Classification = stubClassify,
): PrepareResult {
  const body = text.trim();

  if (body.length < MIN_BODY_LENGTH) {
    return {
      ok: false,
      reason: "어떤 문제인지 한 줄만 더 자세히 적어 주세요.",
    };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return {
      ok: false,
      reason: `내용이 너무 깁니다. ${MAX_BODY_LENGTH}자 이내로 적어 주세요.`,
    };
  }

  try {
    return { ok: true, record: { body, classifier: "stub", ...classify(body) } };
  } catch {
    return {
      ok: true,
      record: {
        body,
        classifier: "stub",
        problemType: null,
        facility: null,
        urgency: null,
        needsReview: true,
        multipleIssues: false,
      },
    };
  }
}
