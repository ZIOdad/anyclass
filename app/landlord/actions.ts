"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

async function requireLandlord() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "landlord") redirect("/report");
}

function backToDetail(id: string, error?: string): never {
  const query = error ? `?error=${encodeURIComponent(error)}` : "";
  redirect(`/landlord/${id}${query}`);
}

// 확인 시각은 처음 누른 때를 유지한다.
async function markConfirmed(id: string) {
  const supabase = await createClient();
  return supabase
    .from("complaints")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", id)
    .is("confirmed_at", null);
}

export async function confirmComplaint(id: string) {
  await requireLandlord();
  const { error } = await markConfirmed(id);
  if (error) backToDetail(id, "확인 처리하지 못했습니다.");

  revalidatePath(`/landlord/${id}`);
  revalidatePath("/report");
  backToDetail(id);
}

// 해결로 표시하면 확인도 함께 기록한다.
export async function resolveComplaint(id: string) {
  await requireLandlord();
  const confirmed = await markConfirmed(id);
  if (confirmed.error) backToDetail(id, "해결 처리하지 못했습니다.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("complaints")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", id)
    .is("resolved_at", null);
  if (error) backToDetail(id, "해결 처리하지 못했습니다.");

  revalidatePath(`/landlord/${id}`);
  revalidatePath("/report");
  backToDetail(id);
}

export async function clearComplaints(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "landlord") redirect("/report");

  // 실수로 지우지 않도록 확인 체크가 있어야 한다.
  if (formData.get("confirm") !== "on") {
    redirect(`/landlord?error=${encodeURIComponent("지우려면 확인 체크를 눌러 주세요.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("complaints").delete().not("id", "is", null);
  if (error) {
    redirect(`/landlord?error=${encodeURIComponent("지우지 못했습니다.")}`);
  }

  revalidatePath("/landlord");
  redirect("/landlord");
}
