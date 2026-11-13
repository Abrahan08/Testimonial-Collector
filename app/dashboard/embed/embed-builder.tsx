"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/app/dashboard/spaces/[id]/created/copy-button";
import { TestimonialWall } from "@/components/embed/testimonial-wall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { buildIframeSnippet, buildScriptSnippet } from "@/lib/embed-snippets";
import {
  EMBED_DEFAULTS,
  EMBED_SOURCES,
  EMBED_STYLES,
  hexColorSchema,
  type EmbedSourceKey,
  type EmbedStyleKey,
} from "@/lib/validators/embed";
import { saveEmbedConfigAction } from "./actions";

type Initial = {
  style: EmbedStyleKey;
  darkMode: boolean;
  animation: boolean;
  backgroundColor: string;
  source: EmbedSourceKey;
};

type PreviewItem = {
  name: string;
  company: string | null;
  rating: number | null;
  text: string;
  isWallOfLove: boolean;
};

const STYLE_LABELS: Record<EmbedStyleKey, string> = { masonry: "Masonry", carousel: "Carousel" };
const SOURCE_LABELS: Record<EmbedSourceKey, string> = {
  all_visible: "All visible testimonials",
  wall_of_love: "Wall of Love only",
};

// <input type="color"> only understands #rrggbb.
function toSixDigits(hex: string) {
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
}

export function EmbedBuilder({
  spaces,
  spaceId,
  slug,
  appUrl,
  initial,
  testimonials,
}: {
  spaces: { id: string; name: string }[];
  spaceId: string;
  slug: string;
  appUrl: string;
  initial: Initial;
  testimonials: PreviewItem[];
}) {
  const router = useRouter();
  const [style, setStyle] = useState(initial.style);
  const [darkMode, setDarkMode] = useState(initial.darkMode);
  const [animation, setAnimation] = useState(initial.animation);
  const [bgText, setBgText] = useState(initial.backgroundColor);
  const [source, setSource] = useState(initial.source);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(null);

  const bgValid = hexColorSchema.safeParse(bgText).success;
  // An invalid colour never reaches the widget or the snippets.
  const bg = bgValid ? bgText : EMBED_DEFAULTS.bg;

  const visible = useMemo(
    () => (source === "wall_of_love" ? testimonials.filter((t) => t.isWallOfLove) : testimonials),
    [source, testimonials],
  );

  const options = { style, dark: darkMode, animation, bg };
  const scriptSnippet = buildScriptSnippet(appUrl, slug, options);
  const iframeSnippet = buildIframeSnippet(appUrl, slug, options);

  function save() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveEmbedConfigAction({
        spaceId,
        style,
        darkMode,
        animation,
        backgroundColor: bg,
        source,
      });
      setStatus(
        result.ok
          ? { kind: "ok", message: "Saved" }
          : { kind: "error", message: result.formError ?? "Could not save. Try again." },
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Space</span>
        <select
          aria-label="Space"
          value={spaceId}
          onChange={(e) => router.push(`/dashboard/embed?space=${encodeURIComponent(e.target.value)}`)}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <section aria-label="Settings" className="grid gap-4 rounded-xl p-4 ring-1 ring-foreground/10 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Style
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as EmbedStyleKey)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm font-normal"
          >
            {EMBED_STYLES.map((s) => (
              <option key={s} value={s}>
                {STYLE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Source
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as EmbedSourceKey)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm font-normal"
          >
            {EMBED_SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <Switch id="embed-dark" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
          <Label htmlFor="embed-dark">Dark mode</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="embed-animation" checked={animation} onChange={(e) => setAnimation(e.target.checked)} />
          <Label htmlFor="embed-animation">Animation</Label>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="embed-bg">Background color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Background color picker"
              value={toSixDigits(bg)}
              onChange={(e) => setBgText(e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-input bg-background p-0.5"
            />
            <Input
              id="embed-bg"
              value={bgText}
              maxLength={7}
              onChange={(e) => setBgText(e.target.value.trim())}
              aria-invalid={!bgValid}
              className="w-32 font-mono"
            />
          </div>
          {!bgValid && (
            <p role="alert" className="text-sm text-destructive">
              Use a hex colour like #ffffff or #fff.
            </p>
          )}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending || !bgValid}>
          {pending ? "Saving..." : "Save"}
        </Button>
        {status && (
          <p
            role="status"
            className={status.kind === "ok" ? "text-sm text-muted-foreground" : "text-sm text-destructive"}
          >
            {status.message}
          </p>
        )}
      </div>

      <section aria-label="Live preview" className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Preview</h2>
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10" data-testid="embed-preview">
          <TestimonialWall
            testimonials={visible}
            style={style}
            dark={darkMode}
            animation={animation}
            bg={bg}
            emptyMessage="No testimonials yet"
          />
        </div>
      </section>

      <section aria-label="Snippets" className="flex flex-col gap-4">
        <Snippet title="JavaScript snippet" code={scriptSnippet} testId="snippet-script" />
        <Snippet title="iframe snippet" code={iframeSnippet} testId="snippet-iframe" />
      </section>
    </div>
  );
}

function Snippet({ title, code, testId }: { title: string; code: string; testId: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        <CopyButton text={code} />
      </div>
      <pre
        data-testid={testId}
        className="overflow-x-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap break-all"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
