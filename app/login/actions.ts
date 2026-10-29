"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

function backToLogin(key: "error" | "message", text: string): never {
  redirect(`/login?${key}=${encodeURIComponent(text)}`);
}

export async function signIn(formData: FormData) {
  const { email, password } = readCredentials(formData);
  if (!email || !password) backToLogin("error", "이메일과 비밀번호를 입력해 주세요.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) backToLogin("error", "이메일 또는 비밀번호가 올바르지 않습니다.");

  redirect("/");
}

export async function signUp(formData: FormData) {
  const { email, password } = readCredentials(formData);
  if (!email || !password) backToLogin("error", "이메일과 비밀번호를 입력해 주세요.");

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) backToLogin("error", error.message);

  // 이메일 확인이 꺼져 있으면 세션이 바로 생긴다.
  if (data.session) redirect("/");
  backToLogin("message", "확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료해 주세요.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
