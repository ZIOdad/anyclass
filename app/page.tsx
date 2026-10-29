import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const home = { admin: "/admin", landlord: "/landlord", tenant: "/report" } as const;
  redirect(home[user.role]);
}
