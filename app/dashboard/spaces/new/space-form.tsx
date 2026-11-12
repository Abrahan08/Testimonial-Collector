"use client";

import { useActionState, useState } from "react";
import { createSpaceAction, type CreateSpaceState } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { THEME_KEYS, THEMES, type ThemeKey } from "@/lib/themes";

const initial: CreateSpaceState = {};

const OPTIONAL_FIELDS = [
  { key: "company", label: "Company" },
  { key: "socialLink", label: "Social link" },
  { key: "photo", label: "Profile photo" },
] as const;

type OptionalKey = (typeof OPTIONAL_FIELDS)[number]["key"];
type FieldState = Record<OptionalKey, { enabled: boolean; required: boolean }>;

export function SpaceForm() {
  const [state, action, pending] = useActionState(createSpaceAction, initial);
  const errors = state.fieldErrors ?? {};

  // Controlled so typed values survive a failed submit.
  const [text, setText] = useState({ name: "", title: "", subtitle: "", ask: "" });
  const [collectRating, setCollectRating] = useState(true);
  const [theme, setTheme] = useState<ThemeKey>("light");
  const [fields, setFields] = useState<FieldState>({
    company: { enabled: false, required: false },
    socialLink: { enabled: false, required: false },
    photo: { enabled: false, required: false },
  });

  const setT = (k: keyof typeof text) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setText((t) => ({ ...t, [k]: e.target.value }));

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create a space</CardTitle>
        <CardDescription>A space has one public link where customers leave testimonials.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Space name</Label>
            <Input id="name" name="name" value={text.name} onChange={setT("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={text.title} onChange={setT("title")} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-sm text-destructive">{errors.title[0]}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" name="subtitle" value={text.subtitle} onChange={setT("subtitle")} aria-invalid={!!errors.subtitle} />
            {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle[0]}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ask">Ask</Label>
            <textarea
              id="ask"
              name="ask"
              rows={3}
              value={text.ask}
              onChange={setT("ask")}
              aria-invalid={!!errors.ask}
              className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
            />
            {errors.ask && <p className="text-sm text-destructive">{errors.ask[0]}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="collectRating">Collect rating (1-5 stars)</Label>
            <Switch id="collectRating" name="collectRating" checked={collectRating} onChange={(e) => setCollectRating(e.target.checked)} />
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">Form fields</legend>
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-3 text-sm">
              <span />
              <span className="text-muted-foreground">Show</span>
              <span className="text-muted-foreground">Required</span>

              {["Name", "Email"].map((label) => (
                <FixedRow key={label} label={label} />
              ))}

              {OPTIONAL_FIELDS.map(({ key, label }) => (
                <div key={key} className="contents">
                  <span>{label}</span>
                  <Switch
                    aria-label={`Show ${label}`}
                    name={`field_${key}_enabled`}
                    checked={fields[key].enabled}
                    onChange={(e) =>
                      setFields((f) => ({
                        ...f,
                        [key]: { enabled: e.target.checked, required: e.target.checked ? f[key].required : false },
                      }))
                    }
                  />
                  <Switch
                    aria-label={`${label} required`}
                    name={`field_${key}_required`}
                    checked={fields[key].required}
                    disabled={!fields[key].enabled}
                    onChange={(e) => setFields((f) => ({ ...f, [key]: { ...f[key], required: e.target.checked } }))}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Theme</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {THEME_KEYS.map((key) => {
                const t = THEMES[key];
                return (
                  <label
                    key={key}
                    className="flex cursor-pointer flex-col gap-2 rounded-lg p-2 ring-1 ring-foreground/10 has-checked:ring-2 has-checked:ring-primary"
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={key}
                      checked={theme === key}
                      onChange={() => setTheme(key)}
                      className="sr-only"
                    />
                    <span
                      className="flex h-12 items-end gap-1 rounded-md p-1.5"
                      style={{ background: t.background, border: `1px solid ${t.border}` }}
                    >
                      <span className="h-3 w-6 rounded-sm" style={{ background: t.accent }} />
                      <span className="h-3 w-4 rounded-sm" style={{ background: t.surface }} />
                    </span>
                    <span className="text-sm">{t.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.theme && <p className="text-sm text-destructive">{errors.theme[0]}</p>}
          </fieldset>

          {errors.fields && <p className="text-sm text-destructive">{errors.fields[0]}</p>}

          {state.formError && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {state.formError}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create space"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function FixedRow({ label }: { label: string }) {
  return (
    <div className="contents">
      <span>
        {label} <span className="text-xs text-muted-foreground">(always on)</span>
      </span>
      <Switch aria-label={`${label} shown (locked)`} checked disabled readOnly />
      <Switch aria-label={`${label} required (locked)`} checked disabled readOnly />
    </div>
  );
}
