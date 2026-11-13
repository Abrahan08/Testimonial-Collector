"use client";

import { Button } from "@/components/ui/button";

// App-wide error boundary (PRD 5.9). The error object is deliberately not rendered:
// no message, stack or digest is ever shown to the user.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        An unexpected error happened on our side. Please try again in a moment.
      </p>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
