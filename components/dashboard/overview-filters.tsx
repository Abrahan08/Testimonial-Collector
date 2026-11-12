import { Button } from "@/components/ui/button";
import { GRANULARITIES, RANGES, type Granularity, type Range } from "@/lib/validators/dashboard";

const SELECT = "h-8 rounded-lg border border-input bg-background px-2 text-sm";

// Plain GET form: the page is rendered on the server from the query params.
export function OverviewFilters({
  spaces,
  spaceId,
  range,
  granularity,
}: {
  spaces: { id: string; name: string }[];
  spaceId: string | undefined;
  range: Range;
  granularity: Granularity;
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Space
        <select name="space" defaultValue={spaceId ?? ""} className={SELECT}>
          <option value="">All spaces</option>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Range
        <select name="range" defaultValue={String(range)} className={SELECT}>
          {RANGES.map((r) => (
            <option key={r} value={r}>
              Last {r} days
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Granularity
        <select name="granularity" defaultValue={granularity} className={SELECT}>
          {GRANULARITIES.map((g) => (
            <option key={g} value={g}>
              {g[0].toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="outline" size="sm">
        Apply
      </Button>
    </form>
  );
}
