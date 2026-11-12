"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inboxHref } from "@/lib/inbox-query";
import type { InboxStatus } from "@/lib/validators/inbox";

const STATUS_LABELS: { value: InboxStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  { value: "wall", label: "Wall of Love" },
  { value: "hidden", label: "Hidden" },
];

// Only builds URLs; the list itself is rendered on the server from the query params.
export function InboxFilters({
  spaces,
  spaceId,
  status,
  q,
}: {
  spaces: { id: string; name: string }[];
  spaceId: string;
  status: InboxStatus;
  q: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Space</span>
          <select
            aria-label="Space"
            value={spaceId}
            onChange={(e) => router.push(inboxHref({ space: e.target.value }))}
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(inboxHref({ space: spaceId, status, q: search.trim() }));
          }}
        >
          <Input
            type="search"
            aria-label="Search by name or text"
            placeholder="Search name or text"
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>
      <nav aria-label="Status filter" className="flex flex-wrap gap-2">
        {STATUS_LABELS.map((s) => (
          <Link
            key={s.value}
            href={inboxHref({ space: spaceId, status: s.value, q })}
            aria-current={status === s.value ? "page" : undefined}
            className={
              "rounded-full border px-3 py-1 text-sm " +
              (status === s.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")
            }
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
