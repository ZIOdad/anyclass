import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/auth/current-user";
import { signOut } from "@/app/login/actions";

/** 로그인한 화면의 공통 틀: 헤더와 본문 폭, 좌우 여백을 여기서 관리한다. */
export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-heading font-semibold">집주인</span>
            {user.role === "landlord" ? (
              <Link href="/landlord" className="text-muted-foreground hover:text-foreground">
                임대인 확인
              </Link>
            ) : (
              <Link href="/report" className="text-muted-foreground hover:text-foreground">
                민원 접수
              </Link>
            )}
            <Link href="/settings" className="text-muted-foreground hover:text-foreground">
              설정
            </Link>
          </nav>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              로그아웃
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
