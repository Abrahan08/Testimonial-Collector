"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/spaces", label: "Spaces" },
  { href: "/dashboard/inbox", label: "Inbox" },
  { href: "/dashboard/embed", label: "Embed" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-11 shrink-0 items-center rounded-md px-2.5 text-sm font-medium md:px-3 whitespace-nowrap transition-colors duration-150 ease-out md:h-9",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
