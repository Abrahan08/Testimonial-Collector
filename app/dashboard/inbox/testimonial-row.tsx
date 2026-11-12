"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, MoreHorizontal, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/inbox-query";
import { setFavoriteAction, setHiddenAction, setWallOfLoveAction } from "./actions";
import { DeleteTestimonialDialog } from "./delete-testimonial-dialog";
import { EditTestimonialDialog } from "./edit-testimonial-dialog";

export type InboxItem = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  text: string;
  rating: number | null;
  photoUrl: string | null;
  consentToShare: boolean;
  isFavorite: boolean;
  isWallOfLove: boolean;
  isHidden: boolean;
  createdAt: string;
};

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export function TestimonialRow({ item, collectRating }: { item: InboxItem; collectRating: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The server action revalidates the inbox; refresh() pulls the new render immediately.
  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch {
        setError("Something went wrong. Please try again.");
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl p-4 ring-1 ring-foreground/10" data-testid="inbox-row">
      <div className="flex items-start gap-3">
        {item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photoUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium"
          >
            {initials(item.name)}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{item.name}</span>
            <span className="text-sm text-muted-foreground">{item.email}</span>
            {item.company && <span className="text-sm text-muted-foreground">· {item.company}</span>}
          </div>
          {item.rating !== null && (
            <div role="img" aria-label={`${item.rating} out of 5 stars`} className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  aria-hidden
                  className={"size-4 " + (n <= item.rating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
                />
              ))}
            </div>
          )}
          {/* Plain text node: never HTML. */}
          <p className="text-sm whitespace-pre-wrap break-words">{item.text}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <time dateTime={item.createdAt}>{dateFormat.format(new Date(item.createdAt))}</time>
            <Badge variant={item.consentToShare ? "secondary" : "outline"}>
              {item.consentToShare ? "Can share" : "Private"}
            </Badge>
            {item.isHidden && <Badge variant="destructive">Hidden</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-pressed={item.isFavorite}
            aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => run(() => setFavoriteAction({ id: item.id, value: !item.isFavorite }))}
          >
            <Star className={item.isFavorite ? "fill-amber-400 text-amber-400" : ""} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-pressed={item.isWallOfLove}
            aria-label={item.isWallOfLove ? "Remove from Wall of Love" : "Add to Wall of Love"}
            onClick={() => run(() => setWallOfLoveAction({ id: item.id, value: !item.isWallOfLove }))}
          >
            <Heart className={item.isWallOfLove ? "fill-rose-500 text-rose-500" : ""} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More actions"
              className="inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => run(() => setHiddenAction({ id: item.id, value: !item.isHidden }))}>
                {item.isHidden ? "Unhide" : "Hide"}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <EditTestimonialDialog
        open={editing}
        onOpenChange={setEditing}
        id={item.id}
        name={item.name}
        text={item.text}
        rating={item.rating}
        collectRating={collectRating}
      />
      <DeleteTestimonialDialog open={deleting} onOpenChange={setDeleting} id={item.id} name={item.name} />
    </li>
  );
}
