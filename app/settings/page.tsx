import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

import { updateDisplayName } from "./actions";

export default async function SettingsPage({
  searchParams,
}: PageProps<"/settings">) {
  const { error, saved } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell user={user}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>설정</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateDisplayName} className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="display_name">표시 이름</FieldLabel>
                <Input
                  id="display_name"
                  name="display_name"
                  defaultValue={profile?.display_name ?? ""}
                  maxLength={50}
                />
                {saved && <FieldDescription>저장했습니다.</FieldDescription>}
                {typeof error === "string" && <FieldError>{error}</FieldError>}
              </Field>
            </FieldGroup>
            <Button type="submit">저장</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
