"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
}

function back(error?: string): never {
  revalidatePath("/admin");
  redirect(error ? `/admin?error=${encodeURIComponent(error)}` : "/admin");
}

export async function createProperty(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) back("물건 이름을 입력해 주세요.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .insert({ name, address: address || null });
  if (error) back("물건을 추가하지 못했습니다.");
  back();
}

export async function deleteProperty(propertyId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) back("물건을 지우지 못했습니다.");
  back();
}

export async function linkMember(propertyId: string, formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) back("연결할 사용자를 골라 주세요.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("property_members")
    .insert({ property_id: propertyId, user_id: userId });
  if (error) {
    back(error.code === "23505" ? "이미 연결된 사용자입니다." : "연결하지 못했습니다.");
  }
  back();
}

export async function unlinkMember(propertyId: string, userId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("property_members")
    .delete()
    .eq("property_id", propertyId)
    .eq("user_id", userId);
  if (error) back("연결을 해제하지 못했습니다.");
  back();
}

export async function setRole(userId: string, formData: FormData) {
  await requireAdmin();
  const role = String(formData.get("role") ?? "");
  if (role !== "tenant" && role !== "landlord") back("역할이 올바르지 않습니다.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", {
    target: userId,
    new_role: role,
  });
  if (error) back("역할을 바꾸지 못했습니다.");
  back();
}
