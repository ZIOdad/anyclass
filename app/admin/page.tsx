import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

import {
  createProperty,
  deleteProperty,
  linkMember,
  setRole,
  unlinkMember,
} from "./actions";

type UserRow = { id: string; email: string; display_name: string | null; role: string };
type PropertyRow = {
  id: string;
  name: string;
  address: string | null;
  property_members: { user_id: string }[];
};

const ROLE_LABEL: Record<string, string> = {
  tenant: "임차인",
  landlord: "임대인",
  admin: "관리자",
};

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { error: actionError } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "admin") {
    return (
      <AppShell user={user}>
        <Alert variant="destructive">
          <AlertTitle>접근할 수 없습니다</AlertTitle>
          <AlertDescription>이 화면은 관리자만 볼 수 있습니다.</AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const [usersResult, propertiesResult] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase
      .from("properties")
      .select("id, name, address, property_members(user_id)")
      .order("created_at", { ascending: false })
      .overrideTypes<PropertyRow[]>(),
  ]);

  const users = (usersResult.data ?? []) as UserRow[];
  const properties = propertiesResult.data ?? [];
  const emailById = new Map(users.map((u) => [u.id, u]));
  const loadFailed = usersResult.error || propertiesResult.error;

  return (
    <AppShell user={user}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">관리자</h1>
        <p className="text-muted-foreground">
          물건을 만들고, 가입한 사용자에게 임대인·임차인 역할을 주고 물건에 연결합니다.
        </p>
      </div>

      {loadFailed && (
        <Alert variant="destructive">
          <AlertTitle>목록을 불러오지 못했습니다</AlertTitle>
          <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
        </Alert>
      )}
      {typeof actionError === "string" && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>물건 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProperty} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              이름
              <Input name="name" required maxLength={100} placeholder="예: 샘플 빌라 101호" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              주소 (선택)
              <Input name="address" maxLength={200} />
            </label>
            <Button type="submit">추가</Button>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">물건과 연결된 사용자</h2>
        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 물건이 없습니다.</p>
        ) : (
          properties.map((p) => {
            const linkedIds = new Set(p.property_members.map((m) => m.user_id));
            const candidates = users.filter(
              (u) => u.role !== "admin" && !linkedIds.has(u.id),
            );
            return (
              <Card key={p.id} size="sm">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  {p.address && <CardDescription>{p.address}</CardDescription>}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {p.property_members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">연결된 사용자가 없습니다.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {p.property_members.map((m) => {
                        const member = emailById.get(m.user_id);
                        return (
                          <li key={m.user_id} className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant={member?.role === "landlord" ? "default" : "secondary"}>
                              {ROLE_LABEL[member?.role ?? "tenant"]}
                            </Badge>
                            <span>{member?.email ?? m.user_id}</span>
                            <form action={unlinkMember.bind(null, p.id, m.user_id)}>
                              <Button type="submit" variant="outline" size="xs">
                                연결 해제
                              </Button>
                            </form>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <form
                      action={linkMember.bind(null, p.id)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <select name="user_id" className={selectClass} defaultValue="" aria-label="연결할 사용자">
                        <option value="" disabled>
                          사용자 선택
                        </option>
                        {candidates.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.email} ({ROLE_LABEL[u.role]})
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm">
                        연결
                      </Button>
                    </form>
                    <form action={deleteProperty.bind(null, p.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        물건 삭제
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">가입한 사용자</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="whitespace-normal break-all">{u.email}</TableCell>
                <TableCell>
                  {u.role === "admin" ? (
                    <Badge variant="outline">관리자</Badge>
                  ) : (
                    <form action={setRole.bind(null, u.id)} className="flex items-center gap-2">
                      <select
                        name="role"
                        defaultValue={u.role}
                        className={selectClass}
                        aria-label={`${u.email} 역할`}
                      >
                        <option value="tenant">임차인</option>
                        <option value="landlord">임대인</option>
                      </select>
                      <Button type="submit" variant="outline" size="sm">
                        저장
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </AppShell>
  );
}
