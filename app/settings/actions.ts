"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null })
    .eq("id", data.claims.sub);

  if (error) {
    redirect(`/settings?error=${encodeURIComponent("저장하지 못했습니다.")}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
