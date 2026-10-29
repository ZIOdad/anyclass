import { Badge } from "@/components/ui/badge";

import { progressStage, type ProgressStage } from "./progress";

const STAGE_VARIANT = {
  접수: "destructive",
  처리중: "secondary",
  완료: "default",
} as const;

export function StageBadge({ stage }: { stage: ProgressStage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{stage}</Badge>;
}

export function ComplaintStageBadge(c: {
  confirmedAt: string | null;
  resolvedAt: string | null;
}) {
  return <StageBadge stage={progressStage(c)} />;
}
