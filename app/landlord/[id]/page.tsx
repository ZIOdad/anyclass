import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClassificationSummary } from "@/features/complaints/classification-summary";
import { ProgressSummary } from "@/features/complaints/progress-summary";
import { ComplaintStageBadge } from "@/features/complaints/stage-badge";
import {
  COMPLAINT_COLUMNS,
  formatReceivedAt,
  toComplaintView,
  type ComplaintRow,
} from "@/features/complaints/rows";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

import { confirmComplaint, resolveComplaint } from "../actions";

export default async function ComplaintDetailPage({
  params,
  searchParams,
}: PageProps<"/landlord/[id]">) {
  const { id } = await params;
  const { error: actionError } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "landlord") {
    return (
      <AppShell user={user}>
        <Alert variant="destructive">
          <AlertTitle>접근할 수 없습니다</AlertTitle>
          <AlertDescription>이 화면은 임대인만 볼 수 있습니다.</AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("complaints")
    .select(COMPLAINT_COLUMNS)
    .eq("id", id)
    .maybeSingle<ComplaintRow>();

  if (!data) notFound();
  const complaint = toComplaintView(data);

  return (
    <AppShell user={user}>
      <Link href="/landlord" className="text-sm text-muted-foreground hover:text-foreground">
        ← 접수된 민원
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>임차인이 적은 내용</CardTitle>
          <CardDescription>{formatReceivedAt(complaint.createdAt)} 접수</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="whitespace-pre-wrap">{complaint.body}</p>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">분류 결과</h2>
            <ClassificationSummary
              classification={complaint}
              classifier={complaint.classifier}
            />
            {complaint.needsReview && (
              <p className="text-sm text-muted-foreground">
                분류가 불확실하거나 여러 문제가 섞여 있을 수 있습니다. 위 원문을 직접 확인해 주세요.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            처리 상태
            <ComplaintStageBadge
              confirmedAt={complaint.confirmedAt}
              resolvedAt={complaint.resolvedAt}
            />
          </CardTitle>
          <CardDescription>
            임차인은 내 접수 내역에서 이 상태를 볼 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {typeof actionError === "string" && (
            <Alert variant="destructive">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          <ProgressSummary
            confirmedAt={complaint.confirmedAt}
            resolvedAt={complaint.resolvedAt}
          />
          <div className="flex flex-wrap gap-2">
            {!complaint.confirmedAt && (
              <form action={confirmComplaint.bind(null, complaint.id)}>
                <Button type="submit" variant="outline">
                  확인했습니다
                </Button>
              </form>
            )}
            {!complaint.resolvedAt && (
              <form action={resolveComplaint.bind(null, complaint.id)}>
                <Button type="submit">해결했습니다</Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
