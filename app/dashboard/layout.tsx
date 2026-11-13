import { Suspense } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { NavLinks } from "./nav-links";

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
      <header className="flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-6 py-2">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/dashboard" className="mr-2 font-semibold">
            Testimonial Collector
          </Link>
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </nav>
        <Suspense fallback={null}>
          <UserBar />
        </Suspense>
      </header>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
