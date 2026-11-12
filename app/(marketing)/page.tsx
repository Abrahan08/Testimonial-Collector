import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Testimonial Collector</h1>
      <p className="max-w-md text-muted-foreground">
        Collect testimonials with a shareable link, manage them in one inbox, and embed them on any site.
      </p>
      <div className="flex gap-3">
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Sign up
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Log in
        </Link>
      </div>
    </main>
  );
}
