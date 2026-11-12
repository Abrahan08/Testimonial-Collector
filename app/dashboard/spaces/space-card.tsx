import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteSpaceButton } from "./delete-space-dialog";

type Props = {
  id: string;
  name: string;
  testimonialCount: number;
  publicUrl: string;
  createdAt: string; // ISO
};

export function SpaceCard({ id, name, testimonialCount, publicUrl, createdAt }: Props) {
  const created = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Testimonials</dt>
            <dd>{testimonialCount}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{created}</dd>
          </div>
        </dl>
        <p className="text-xs break-all text-muted-foreground">{publicUrl}</p>
        <div className="flex gap-2">
          {/* Placeholder until the edit page exists. */}
          <Button variant="outline" size="sm" disabled>
            Edit
          </Button>
          <DeleteSpaceButton id={id} name={name} />
        </div>
      </CardContent>
    </Card>
  );
}
