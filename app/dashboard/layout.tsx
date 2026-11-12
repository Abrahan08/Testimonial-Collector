import { Suspense } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";

async function UserBar() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">{user.name}</span>
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm">
          Log out
        </Button>
      </form>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Testimonial Collector
          </Link>
          <Link href="/dashboard/spaces" className="text-sm text-muted-foreground hover:text-foreground">
            Spaces
          </Link>
        </nav>
        <Suspense fallback={null}>
          <UserBar />
        </Suspense>
      </header>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
