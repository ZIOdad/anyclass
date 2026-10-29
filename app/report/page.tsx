import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClassificationSummary, UrgencyLegend } from "@/features/complaints/classification-summary";
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

import { ReportForm } from "./report-form";

export default async function ReportPage({ searchParams }: PageProps<"/report">) {
  const { submitted } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // 임대인은 접수하지 않고 확인만 하고, 관리자는 관리 화면을 쓴다.
  if (user.role === "landlord") redirect("/landlord");
  if (user.role === "admin") redirect("/admin");

  const supabase = await createClient();
  // 임대인 계정은 전체를 읽을 수 있으므로 본인이 보낸 것만 명시해서 가져온다.
  const { data, error } = await supabase
    .from("complaints")
    .select(COMPLAINT_COLUMNS)
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .overrideTypes<ComplaintRow[]>();

  const { data: memberships } = await supabase
    .from("property_members")
    .select("property_id, properties(name)")
    .eq("user_id", user.id)
    .overrideTypes<{ property_id: string; properties: { name: string } | null }[]>();
  const propertyNames = (memberships ?? []).flatMap((m) =>
    m.properties ? [m.properties.name] : [],
  );

  const mine = (data ?? []).map(toComplaintView);
  const justSubmitted =
    typeof submitted === "string" ? mine.find((c) => c.id === submitted) : undefined;

  return (
    <AppShell user={user}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          민원 접수
        </h1>
        <p className="text-muted-foreground">
          생활 중 생긴 문제를 적어 주시면 임대인에게 전달됩니다.
        </p>
      </div>

      {propertyNames.length === 0 ? (
        <Alert variant="destructive">
          <AlertTitle>연결된 물건이 없습니다</AlertTitle>
          <AlertDescription>
            민원을 접수하려면 관리자가 내 계정을 물건에 연결해야 합니다. 관리자에게 요청해 주세요.
          </AlertDescription>
        </Alert>
      ) : (
        <p className="text-sm text-muted-foreground">
          접수 물건: {propertyNames.join(", ")}
        </p>
      )}

      {justSubmitted && (
        <Alert>
          <AlertTitle>이렇게 접수되었습니다</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <ClassificationSummary
              classification={justSubmitted}
              classifier={justSubmitted.classifier}
            />
            <UrgencyLegend />
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <ReportForm />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>내 접수 내역을 불러오지 못했습니다</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">내 접수 내역</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 접수한 민원이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.map((c) => (
              <li key={c.id}>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-3 text-sm font-medium">
                      <span>{c.body}</span>
                      <ComplaintStageBadge
                        confirmedAt={c.confirmedAt}
                        resolvedAt={c.resolvedAt}
                      />
                    </CardTitle>
                    <CardDescription>{formatReceivedAt(c.createdAt)}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <ClassificationSummary classification={c} classifier={c.classifier} />
                    <ProgressSummary
                      confirmedAt={c.confirmedAt}
                      resolvedAt={c.resolvedAt}
                    />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
