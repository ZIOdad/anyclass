import { expect, test } from "vitest";

import { sortByUrgency, type StoredComplaint } from "./classification";

function complaint(
  id: string,
  urgency: StoredComplaint["urgency"],
  createdAt: string,
): StoredComplaint {
  return {
    id,
    body: id,
    problemType: "기타",
    facility: "기타·불명",
    urgency,
    needsReview: false,
    multipleIssues: false,
    createdAt,
  };
}

test("긴급도가 높은 순으로 정렬하고 같은 긴급도에서는 최근 접수가 먼저 온다", () => {
  const sorted = sortByUrgency([
    complaint("낮음-오래됨", "낮음", "2026-10-29T01:00:00Z"),
    complaint("보통-오래됨", "보통", "2026-10-29T01:00:00Z"),
    complaint("긴급-오래됨", "긴급", "2026-10-29T01:00:00Z"),
    complaint("보통-최근", "보통", "2026-10-29T05:00:00Z"),
  ]);

  expect(sorted.map((c) => c.id)).toEqual([
    "긴급-오래됨",
    "보통-최근",
    "보통-오래됨",
    "낮음-오래됨",
  ]);
});

test("분류되지 않은 민원은 보통과 같은 순서로 다룬다", () => {
  const sorted = sortByUrgency([
    complaint("낮음", "낮음", "2026-10-29T09:00:00Z"),
    complaint("분류안됨", null, "2026-10-29T08:00:00Z"),
    complaint("긴급", "긴급", "2026-10-29T01:00:00Z"),
  ]);

  expect(sorted.map((c) => c.id)).toEqual(["긴급", "분류안됨", "낮음"]);
});

test("정렬은 원본 배열을 바꾸지 않는다", () => {
  const input = [
    complaint("낮음", "낮음", "2026-10-29T01:00:00Z"),
    complaint("긴급", "긴급", "2026-10-29T01:00:00Z"),
  ];

  sortByUrgency(input);

  expect(input.map((c) => c.id)).toEqual(["낮음", "긴급"]);
});
