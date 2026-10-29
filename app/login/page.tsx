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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error, message } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>집주인</CardTitle>
          <CardDescription>이메일로 로그인하거나 가입합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={6}
                  required
                />
              </Field>
              {typeof error === "string" && <FieldError>{error}</FieldError>}
              {typeof message === "string" && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </FieldGroup>
            <div className="flex flex-col gap-2">
              <Button type="submit" formAction={signIn}>
                로그인
              </Button>
              <Button type="submit" formAction={signUp} variant="outline">
                가입
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
