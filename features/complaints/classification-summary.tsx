import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { URGENCIES, URGENCY_DEFINITIONS, type StoredClassification } from "./classification";

// 처리 상태 배지(접수·처리중·완료)와 겹치지 않도록 긴급은 진한 빨강,
// 보통·낮음은 테마에 없는 호박·하늘색을 쓴다.
const URGENCY_CLASS = {
  긴급: "bg-destructive text-white dark:bg-destructive dark:text-white",
  보통: "bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200",
  낮음: "bg-sky-100 text-sky-900 dark:bg-sky-400/20 dark:text-sky-200",
} as const;

export function UrgencyBadge({ urgency }: { urgency: keyof typeof URGENCY_CLASS }) {
  return <Badge className={URGENCY_CLASS[urgency]}>{urgency}</Badge>;
}

/** 분류 결과 한 건을 같은 모양으로 보여준다. 임차인 화면과 임대인 화면이 함께 쓴다. */
export function ClassificationSummary({
  classification,
  classifier,
  className,
}: {
  classification: StoredClassification;
  classifier?: string;
  className?: string;
}) {
  const { problemType, facility, urgency, needsReview, multipleIssues } =
    classification;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {urgency ? (
        <UrgencyBadge urgency={urgency} />
      ) : (
        <Badge variant="outline">분류 안 됨</Badge>
      )}
      {problemType && <Badge variant="secondary">{problemType}</Badge>}
      {facility && <Badge variant="outline">{facility}</Badge>}
      {multipleIssues && <Badge variant="outline">여러 문제</Badge>}
      {needsReview && <Badge variant="destructive">확인 필요</Badge>}
      {classifier === "stub" && <Badge variant="outline">임시 분류</Badge>}
    </div>
  );
}

export function UrgencyLegend() {
  return (
    <dl className="flex flex-col gap-1 text-sm text-muted-foreground">
      {URGENCIES.map((urgency) => (
        <div key={urgency} className="flex items-center gap-2">
          <dt className="w-10 shrink-0">
            <UrgencyBadge urgency={urgency} />
          </dt>
          <dd>{URGENCY_DEFINITIONS[urgency]}</dd>
        </div>
      ))}
    </dl>
  );
}
