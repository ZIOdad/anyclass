import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sortByUrgency } from "@/features/complaints";
import { ClassificationSummary, UrgencyLegend } from "@/features/complaints/classification-summary";
import { ProgressDashboard } from "@/features/complaints/progress-dashboard";
import { ComplaintStageBadge } from "@/features/complaints/stage-badge";
import {
  COMPLAINT_COLUMNS,
  formatReceivedAt,
  toComplaintView,
  type ComplaintRow,
} from "@/features/complaints/rows";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

import { clearComplaints } from "./actions";

export default async function LandlordPage({ searchParams }: PageProps<"/landlord">) {
  const { error: actionError } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "landlord") {
    return (
      <AppShell user={user}>
        <Alert variant="destructive">
          <AlertTitle>접근할 수 없습니다</AlertTitle>
          <AlertDescription>
            이 화면은 임대인만 볼 수 있습니다. 임대인 권한이 필요하면 관리자에게 요청해 주세요.
          </AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(COMPLAINT_COLUMNS)
    .overrideTypes<ComplaintRow[]>();

  const complaints = sortByUrgency((data ?? []).map(toComplaintView));

  return (
    <AppShell user={user}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          접수된 민원
        </h1>
        <p className="text-muted-foreground">
          긴급도가 높은 순으로 보입니다. 같은 긴급도에서는 최근 접수가 위에 있습니다.
        </p>
      </div>

      <ProgressDashboard complaints={complaints} />

      <UrgencyLegend />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>민원을 불러오지 못했습니다</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      )}
      {typeof actionError === "string" && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {complaints.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground">아직 접수된 민원이 없습니다.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>상태</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>내용</TableHead>
              <TableHead className="hidden sm:table-cell">접수 시각</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <ComplaintStageBadge
                    confirmedAt={c.confirmedAt}
                    resolvedAt={c.resolvedAt}
                  />
                </TableCell>
                <TableCell>
                  <ClassificationSummary classification={c} classifier={c.classifier} />
                </TableCell>
                <TableCell className="min-w-40 max-w-64 whitespace-normal">
                  <Link
                    href={`/landlord/${c.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {c.body.length > 60 ? `${c.body.slice(0, 60)}…` : c.body}
                  </Link>
                  <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                    {formatReceivedAt(c.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                  {formatReceivedAt(c.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <form action={clearComplaints} className="flex flex-wrap items-center gap-3 border-t pt-6">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="confirm" />
          접수된 민원을 모두 지웁니다 (검증 반복용)
        </label>
        <Button type="submit" variant="outline" size="sm">
          모두 지우기
        </Button>
      </form>
    </AppShell>
  );
}
