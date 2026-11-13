"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelSubscription } from "./actions";

export function CancelButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cancel subscription (demo)
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3" role="group" aria-label="Confirm cancellation">
      <p className="text-sm">
        Cancel Pro? You will drop to Free immediately. Your data is kept, but anything over the Free limits becomes read-only.
      </p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => cancelSubscription())}
        >
          {pending ? "Canceling..." : "Yes, cancel subscription"}
        </Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => setOpen(false)}>
          Keep Pro
        </Button>
      </div>
    </div>
  );
}
