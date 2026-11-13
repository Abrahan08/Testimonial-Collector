import { Suspense } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { NavLinks } from "./nav-links";

async function UserBar() {
  const user = await requireUser();
  return (
    <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-1 md:col-auto md:row-auto md:gap-2">
      <span
        className="max-w-[4.5rem] truncate text-sm font-medium text-foreground min-[480px]:max-w-32 md:max-w-56"
        title={user.name}
      >
        {user.name}
      </span>
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" className="px-3">
          Log out
        </Button>
      </form>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-background">
        {/* Mobile: brand and user on row 1, links scroll on row 2. From md: one row. */}
        <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 px-4 md:flex md:min-h-14 md:gap-x-6 md:px-6">
          <Link
            href="/dashboard"
            className="col-start-1 row-start-1 inline-flex h-11 items-center justify-self-start rounded-md text-base font-semibold whitespace-nowrap text-foreground md:h-9"
          >
            Testimonial Collector
          </Link>
          <nav
            aria-label="Main"
            className="col-span-2 row-start-2 -mx-4 flex items-center gap-0.5 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] md:mx-0 md:flex-1 md:gap-1 md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden"
          >
            <Suspense fallback={null}>
              <NavLinks />
            </Suspense>
          </nav>
          <Suspense fallback={null}>
            <UserBar />
          </Suspense>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 text-sm md:px-6 md:py-8">
        {children}
      </div>
    </div>
  );
}
