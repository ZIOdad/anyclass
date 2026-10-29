import { describe, expect, it } from "vitest";

import { countByStage, progressStage } from "./progress";

const T = "2026-10-29T06:00:00Z";

describe("progressStage", () => {
  it("확인 전이면 접수", () => {
    expect(progressStage({ confirmedAt: null, resolvedAt: null })).toBe("접수");
  });
  it("확인했지만 해결 전이면 처리중", () => {
    expect(progressStage({ confirmedAt: T, resolvedAt: null })).toBe("처리중");
  });
  it("해결되면 완료", () => {
    expect(progressStage({ confirmedAt: T, resolvedAt: T })).toBe("완료");
  });
});

describe("countByStage", () => {
  it("단계별 건수를 센다", () => {
    expect(
      countByStage([
        { confirmedAt: null, resolvedAt: null },
        { confirmedAt: null, resolvedAt: null },
        { confirmedAt: T, resolvedAt: null },
        { confirmedAt: T, resolvedAt: T },
      ]),
    ).toEqual({ 접수: 2, 처리중: 1, 완료: 1 });
  });
  it("비어 있으면 모두 0", () => {
    expect(countByStage([])).toEqual({ 접수: 0, 처리중: 0, 완료: 0 });
  });
});
