"use client";

import { useState } from "react";
import { THEMES, type ThemeKey } from "@/lib/themes";

export type PublicFormField = { key: string; enabled: boolean; required: boolean };

// Passing this switches the view from the static dashboard preview to a working form.
export type InteractiveProps = {
  action: (formData: FormData) => void;
  pending: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
  // Echoed back by the server so the customer's text survives an error.
  values?: Record<string, string | boolean>;
};

type Props = {
  title: string;
  subtitle: string;
  ask: string;
  collectRating: boolean;
  theme: ThemeKey;
  fields: PublicFormField[];
  interactive?: InteractiveProps;
};

// photo is left out of the public form until uploads are built.
const OPTIONAL_LABELS: Record<string, string> = {
  company: "Company",
  socialLink: "Social link",
};
const PREVIEW_ONLY_LABELS: Record<string, string> = { photo: "Profile photo" };

const TEXT_MAX = 1000;

// Renders what a customer sees. Without `interactive` it is a disabled preview with no
// state or server calls (used by the dashboard); with it, real inputs and a working
// submit (used by /s/[slug]). All customer-facing text is rendered as plain JSX text.
export function PublicFormView({ title, subtitle, ask, collectRating, theme, fields, interactive }: Props) {
  const t = THEMES[theme] ?? THEMES.light;
  const live = !!interactive;
  const labels = live ? OPTIONAL_LABELS : { ...OPTIONAL_LABELS, ...PREVIEW_ONLY_LABELS };
  const optional = fields.filter((f) => f.enabled && f.key in labels);

  const inputStyle = { background: t.surface, border: `1px solid ${t.border}`, color: t.text };
  const errorColor = theme === "dark" ? "#f87171" : "#b91c1c";

  const values = interactive?.values ?? {};
  const errors = interactive?.fieldErrors ?? {};
  // Client-side checks run first so required fields show inline errors, not browser tooltips.
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const err = (key: string) => clientErrors[key] ?? errors[key]?.[0];
  const val = (key: string) => (typeof values[key] === "string" ? (values[key] as string) : "");

  const [rating, setRating] = useState(() => Number(val("rating")) || 0);
  const [ratingMissing, setRatingMissing] = useState(false);
  const ratingError = err("rating") ?? (ratingMissing ? "Please choose a rating" : undefined);

  const body = (
    <>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold break-words">{title || "Your title"}</h2>
        {subtitle && (
          <p className="text-sm break-words" style={{ color: t.mutedText }}>
            {subtitle}
          </p>
        )}
      </div>
      {ask && <p className="text-sm break-words whitespace-pre-wrap">{ask}</p>}

      {collectRating && (
        <div className="flex flex-col gap-1" data-testid="preview-rating">
          <span className="text-sm font-medium" id="rating-label">
            Rating {live && <Star required />}
          </span>
          {live ? (
            <div role="radiogroup" aria-labelledby="rating-label" className="flex gap-1 text-3xl leading-none">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => {
                    setRating(n);
                    setRatingMissing(false);
                  }}
                  className="cursor-pointer p-0.5"
                  style={{ color: n <= rating ? t.accent : t.border }}
                >
                  ★
                </button>
              ))}
              <input type="hidden" name="rating" value={rating || ""} />
            </div>
          ) : (
            <div className="flex gap-1 text-2xl leading-none" style={{ color: t.accent }} aria-hidden="true">
              {"★★★★★".split("").map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          )}
          <FieldError message={ratingError} color={errorColor} />
        </div>
      )}

      <TextField label="Name" name="name" required live={live} style={inputStyle} value={val("name")} error={err("name")} errorColor={errorColor} maxLength={100} autoComplete="name" />
      <TextField label="Email" name="email" type="email" required live={live} style={inputStyle} value={val("email")} error={err("email")} errorColor={errorColor} autoComplete="email" />
      {optional.map((f) => (
        <TextField
          key={f.key}
          label={labels[f.key]}
          name={f.key}
          type={f.key === "socialLink" ? "url" : "text"}
          required={f.required}
          live={live}
          style={inputStyle}
          value={val(f.key)}
          error={err(f.key)}
          errorColor={errorColor}
          maxLength={f.key === "socialLink" ? 500 : 100}
        />
      ))}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">
          Your testimonial <Star required />
        </span>
        <textarea
          name="text"
          rows={4}
          disabled={!live}
          required={live}
          maxLength={TEXT_MAX}
          defaultValue={val("text")}
          aria-invalid={!!err("text")}
          className="rounded-lg px-2.5 py-2 text-sm"
          style={inputStyle}
        />
        <FieldError message={err("text")} color={errorColor} />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="consentToShare"
          disabled={!live}
          defaultChecked={values.consentToShare === true}
          className="mt-0.5"
        />
        <span>I allow this testimonial to be shared publicly</span>
      </label>

      {live && (
        <>
          {/* Honeypot: invisible to people, tempting to bots. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label>
              Leave this empty
              <input type="text" name="hp_website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          {interactive.formError && (
            <p role="alert" className="text-sm" style={{ color: errorColor }}>
              {interactive.formError}
            </p>
          )}
        </>
      )}

      <button
        type={live ? "submit" : "button"}
        disabled={!live || interactive.pending}
        className={`rounded-lg px-4 py-2 text-sm font-medium ${live ? "" : "cursor-not-allowed opacity-60"} disabled:opacity-60`}
        style={{ background: t.accent, color: t.accentText }}
      >
        {live && interactive.pending ? "Sending…" : "Submit"}
      </button>
    </>
  );

  const shell = {
    "data-testid": "public-form-view",
    className: "relative flex flex-col gap-4 rounded-xl p-6",
    style: { background: t.background, color: t.text, border: `1px solid ${t.border}` },
  };

  if (!interactive) return <div {...shell}>{body}</div>;

  return (
    <form
      {...shell}
      action={interactive.action}
      noValidate
      onSubmit={(e) => {
        const found: Record<string, string> = {};
        const els = e.currentTarget.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]");
        for (const el of els) {
          if (el.type === "hidden" || el.type === "checkbox" || el.name === "hp_website") continue;
          if (el.checkValidity()) continue;
          found[el.name] = el.validity.valueMissing
            ? "This field is required"
            : el.validity.typeMismatch
              ? el.type === "email"
                ? "Enter a valid email address"
                : "Enter a valid link starting with http:// or https://"
              : el.validationMessage;
        }
        const ratingBad = collectRating && rating === 0;
        setClientErrors(found);
        setRatingMissing(ratingBad);
        if (ratingBad || Object.keys(found).length > 0) e.preventDefault();
      }}
    >
      {body}
    </form>
  );
}

function Star({ required }: { required: boolean }) {
  return required ? (
    <span aria-hidden="true" title="Required">
      *
    </span>
  ) : null;
}

function FieldError({ message, color }: { message?: string; color: string }) {
  return message ? (
    <span role="alert" className="text-xs" style={{ color }}>
      {message}
    </span>
  ) : null;
}

function TextField({
  label,
  name,
  type = "text",
  required,
  live,
  style,
  value,
  error,
  errorColor,
  maxLength,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required: boolean;
  live: boolean;
  style: React.CSSProperties;
  value: string;
  error?: string;
  errorColor: string;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        {label} <Star required={required} />
      </span>
      <input
        type={live ? type : "text"}
        name={live ? name : undefined}
        disabled={!live}
        required={live && required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        defaultValue={value}
        aria-invalid={!!error}
        className="rounded-lg px-2.5 py-1.5 text-sm"
        style={style}
      />
      <FieldError message={error} color={errorColor} />
    </label>
  );
}
