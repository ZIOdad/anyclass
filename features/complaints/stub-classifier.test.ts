import { expect, test } from "vitest";

import { stubClassify } from "./stub-classifier";

test("욕실 천장 누수는 누수·욕실로 분류하고 확인 필요가 없다", () => {
  expect(stubClassify("욕실 천장에서 물이 새요")).toMatchObject({
    problemType: "누수",
    facility: "욕실",
    urgency: "보통",
    needsReview: false,
    multipleIssues: false,
  });
});

test("가스 냄새는 긴급으로 분류한다", () => {
  expect(stubClassify("주방에서 가스 냄새가 나요").urgency).toBe("긴급");
});

test("난방이 안 나오면 난방·온수이고 긴급이다", () => {
  expect(stubClassify("보일러 난방이 안 나와요")).toMatchObject({
    problemType: "난방·온수",
    facility: "보일러·온수기",
    urgency: "긴급",
  });
});

test("미관 문제는 낮음으로 분류한다", () => {
  expect(stubClassify("현관 도어락 겉에 흠집이 조금 났어요").urgency).toBe(
    "낮음",
  );
});

test("대상 시설을 알 수 없으면 기타·불명이고 확인 필요가 붙는다", () => {
  expect(stubClassify("곰팡이가 계속 생겨요")).toMatchObject({
    problemType: "곰팡이",
    facility: "기타·불명",
    needsReview: true,
  });
});

test("어떤 키워드도 없으면 기타·기타·불명이고 확인 필요가 붙는다", () => {
  expect(stubClassify("뭔가 이상한 소리가 계속 나요")).toMatchObject({
    problemType: "기타",
    facility: "기타·불명",
    needsReview: true,
  });
});

test("문제가 여러 개면 한 건으로 분류하고 여러 문제와 확인 필요를 표시한다", () => {
  const result = stubClassify("욕실에서 물이 새고 현관 도어락도 안 열려요");

  expect(result.multipleIssues).toBe(true);
  expect(result.needsReview).toBe(true);
});

test("여러 문제 중 가장 긴급한 문제를 기준으로 분류한다", () => {
  const result = stubClassify(
    "현관 도어락 겉에 흠집이 조금 났어요. 그리고 거실에서 정전이 됐어요",
  );

  expect(result.multipleIssues).toBe(true);
  expect(result.problemType).toBe("전기");
  expect(result.urgency).toBe("긴급");
});
