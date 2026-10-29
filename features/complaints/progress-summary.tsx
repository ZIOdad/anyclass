import { Badge } from "@/components/ui/badge";

import { formatReceivedAt } from "./rows";

export function ProgressSummary({
  confirmedAt,
  resolvedAt,
}: {
  confirmedAt: string | null;
  resolvedAt: string | null;
}) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <dt className="text-muted-foreground">임대인 확인</dt>
        <dd>
          {confirmedAt ? (
            <>
              <Badge variant="secondary">확인함</Badge> {formatReceivedAt(confirmedAt)}
            </>
          ) : (
            <Badge variant="destructive">확인 전</Badge>
          )}
        </dd>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <dt className="text-muted-foreground">해결 일자</dt>
        <dd>
          {resolvedAt ? (
            <>
              <Badge>해결됨</Badge> {formatReceivedAt(resolvedAt)}
            </>
          ) : (
            <Badge variant="outline">해결 전</Badge>
          )}
        </dd>
      </div>
    </dl>
  );
}
