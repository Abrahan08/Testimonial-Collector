"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteSpaceAction } from "./actions";

export function DeleteSpaceButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteSpaceAction({ id, confirmName: typed });
      if (result.error) {
        setError(result.error);
        if (result.notFound) router.refresh();
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-destructive/40 p-3" role="group" aria-label={`Delete ${name}`}>
      <p className="text-sm">
        This permanently deletes the space and all its testimonials. Type <strong>{name}</strong> to confirm.
      </p>
      <Label htmlFor={`confirm-${id}`} className="sr-only">
        Type the space name to confirm
      </Label>
      <Input id={`confirm-${id}`} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" disabled={typed !== name || pending} onClick={confirmDelete}>
          {pending ? "Deleting..." : "Delete space"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setTyped("");
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
