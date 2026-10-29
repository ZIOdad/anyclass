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
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      reporter_id: user.id,
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
