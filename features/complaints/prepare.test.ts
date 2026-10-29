import { expect, test } from "vitest";

import { prepareComplaint } from "./prepare";

test("비어 있거나 너무 짧은 민원은 접수하지 않고 더 적어 달라고 안내한다", () => {
  expect(prepareComplaint("   ")).toMatchObject({ ok: false });
  expect(prepareComplaint("아")).toMatchObject({ ok: false });
});

test("너무 긴 민원은 접수하지 않는다", () => {
  expect(prepareComplaint("가".repeat(1001))).toMatchObject({ ok: false });
});

test("정상 민원은 원문과 분류 결과로 접수 기록을 만든다", () => {
  const result = prepareComplaint("  욕실 천장에서 물이 새요  ");

  expect(result).toMatchObject({
    ok: true,
    record: {
      body: "욕실 천장에서 물이 새요",
      problemType: "누수",
      facility: "욕실",
      classifier: "stub",
      needsReview: false,
    },
  });
});

test("분류기가 실패해도 접수하고 분류 안 됨·확인 필요로 남긴다", () => {
  const result = prepareComplaint("욕실 천장에서 물이 새요", () => {
    throw new Error("분류기 실패");
  });

  expect(result).toMatchObject({
    ok: true,
    record: {
      body: "욕실 천장에서 물이 새요",
      problemType: null,
      facility: null,
      urgency: null,
      needsReview: true,
      multipleIssues: false,
    },
  });
});
