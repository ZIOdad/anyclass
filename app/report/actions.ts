"use server";

import { redirect } from "next/navigation";

import { prepareComplaint } from "@/features/complaints";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type ReportState = { error?: string; text?: string };

export async function submitComplaint(
  _previous: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const text = String(formData.get("body") ?? "");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prepared = prepareComplaint(text);
  if (!prepared.ok) return { error: prepared.reason, text };

  const { record } = prepared;
  const supabase = await createClient();

  // 가장 최근에 연결된 물건에 접수한다.
  const { data: membership } = await supabase
    .from("property_members")
    .select("property_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return { error: "연결된 물건이 없어 접수할 수 없습니다. 관리자에게 연결을 요청해 주세요.", text };
  }

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      reporter_id: user.id,
      property_id: membership.property_id,
      body: record.body,
      problem_type: record.problemType,
      facility: record.facility,
      urgency: record.urgency,
      needs_review: record.needsReview,
      multiple_issues: record.multipleIssues,
      classifier: record.classifier,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "접수하지 못했습니다. 잠시 후 다시 시도해 주세요.", text };
  }

  redirect(`/report?submitted=${data.id}`);
}
