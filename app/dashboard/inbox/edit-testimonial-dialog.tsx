"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TESTIMONIAL_TEXT_MAX } from "@/lib/validators/testimonial";
import { editTestimonialAction, type EditTestimonialState } from "./actions";

export function EditTestimonialDialog({
  open,
  onOpenChange,
  id,
  name: initialName,
  text: initialText,
  rating: initialRating,
  collectRating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  name: string;
  text: string;
  rating: number | null;
  collectRating: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [text, setText] = useState(initialText);
  const [rating, setRating] = useState<number | null>(initialRating);
  const [state, setState] = useState<EditTestimonialState>({});
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) {
      // Re-sync with the latest saved values each time the dialog opens.
      setName(initialName);
      setText(initialText);
      setRating(initialRating);
      setState({});
    }
    onOpenChange(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({});
    startTransition(async () => {
      try {
        const result = await editTestimonialAction({
          id,
          name,
          text,
          ...(collectRating ? { rating } : {}),
        });
        setState(result);
        if (result.ok) onOpenChange(false);
      } catch {
        setState({ formError: "Could not save the testimonial. It may have been deleted." });
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit testimonial</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-name-${id}`}>Name</Label>
            <Input
              id={`edit-name-${id}`}
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!state.fieldErrors?.name}
            />
            {state.fieldErrors?.name && <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-text-${id}`}>Text</Label>
            <textarea
              id={`edit-text-${id}`}
              value={text}
              rows={5}
              maxLength={TESTIMONIAL_TEXT_MAX}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={!!state.fieldErrors?.text}
              className="rounded-lg border border-input bg-background p-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {text.length} / {TESTIMONIAL_TEXT_MAX}
            </p>
            {state.fieldErrors?.text && <p className="text-sm text-destructive">{state.fieldErrors.text[0]}</p>}
          </div>
          {collectRating && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`edit-rating-${id}`}>Rating</Label>
              <select
                id={`edit-rating-${id}`}
                value={rating ?? ""}
                onChange={(e) => setRating(e.target.value === "" ? null : Number(e.target.value))}
                className="h-8 w-32 rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="">No rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.rating && <p className="text-sm text-destructive">{state.fieldErrors.rating[0]}</p>}
            </div>
          )}
          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
