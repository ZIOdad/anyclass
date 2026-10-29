import { createClient } from "@/lib/supabase/server";

export type Role = "tenant" | "landlord";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

/** 서버에서 서명이 검증된 claims로 현재 사용자를 확인한다. 로그인하지 않았으면 null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .maybeSingle();

  return {
    id: data.claims.sub,
    email: String(data.claims.email ?? ""),
    role: profile?.role === "landlord" ? "landlord" : "tenant",
  };
}
