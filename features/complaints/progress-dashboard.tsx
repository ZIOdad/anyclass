import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { countByStage, PROGRESS_STAGES } from "./progress";
import { StageBadge } from "./stage-badge";

const DESCRIPTIONS = {
  접수: "아직 확인 전",
  처리중: "확인했고 해결 전",
  완료: "해결됨",
} as const;

export function ProgressDashboard({
  complaints,
}: {
  complaints: { confirmedAt: string | null; resolvedAt: string | null }[];
}) {
  const counts = countByStage(complaints);
  return (
    <section aria-label="처리 현황" className="grid grid-cols-3 gap-3">
      {PROGRESS_STAGES.map((stage) => (
        <Card key={stage} size="sm">
          <CardHeader>
            <CardDescription>
              <StageBadge stage={stage} />
            </CardDescription>
            <CardTitle className="font-heading text-3xl tabular-nums">
              {counts[stage]}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {DESCRIPTIONS[stage]}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
