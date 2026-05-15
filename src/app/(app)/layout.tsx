import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={session.user} />
      <main className="container flex-1 py-8">{children}</main>
    </div>
  );
}
