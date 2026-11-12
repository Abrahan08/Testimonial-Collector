import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { publicSpaceUrl } from "@/lib/urls";
import { CopyButton } from "./copy-button";

async function Created({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const space = await db.space.findFirst({
    where: { id, ownerId: user.id },
    select: { name: true, slug: true },
  });
  if (!space) notFound();

  const url = publicSpaceUrl(space.slug);
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Your space is ready</CardTitle>
        <CardDescription>Share this link to start collecting testimonials for {space.name}.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm break-all" data-testid="public-link">
            {url}
          </code>
          <CopyButton text={url} />
        </div>
        <Link href="/dashboard/spaces" className={buttonVariants({ variant: "outline", size: "sm" }) + " self-start"}>
          Back to spaces
        </Link>
      </CardContent>
    </Card>
  );
}

export default function CreatedPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col">
      <Suspense fallback={null}>
        <Created params={params} />
      </Suspense>
    </main>
  );
}
