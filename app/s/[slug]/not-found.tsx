export default function SpaceNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-semibold">We couldn&apos;t find this page</h1>
      <p className="text-sm text-muted-foreground">
        The link may be mistyped, or the page may have been removed. Please check with whoever sent it to you.
      </p>
    </main>
  );
}
