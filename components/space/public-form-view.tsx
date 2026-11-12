import { THEMES, type ThemeKey } from "@/lib/themes";

export type PublicFormField = { key: string; enabled: boolean; required: boolean };

type Props = {
  title: string;
  subtitle: string;
  ask: string;
  collectRating: boolean;
  theme: ThemeKey;
  fields: PublicFormField[];
};

const OPTIONAL_LABELS: Record<string, string> = {
  company: "Company",
  socialLink: "Social link",
  photo: "Profile photo",
};

// Presentational: renders what a customer sees. No state, no server calls, so
// the dashboard preview and the public page can both use it. All text is
// rendered as plain JSX text.
export function PublicFormView({ title, subtitle, ask, collectRating, theme, fields }: Props) {
  const t = THEMES[theme] ?? THEMES.light;
  const optional = fields.filter((f) => f.enabled && f.key in OPTIONAL_LABELS);

  const inputStyle = { background: t.surface, border: `1px solid ${t.border}`, color: t.text };

  return (
    <div
      data-testid="public-form-view"
      className="flex flex-col gap-4 rounded-xl p-6"
      style={{ background: t.background, color: t.text, border: `1px solid ${t.border}` }}
    >
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
          <span className="text-sm font-medium">Rating</span>
          <div className="flex gap-1 text-2xl leading-none" style={{ color: t.accent }} aria-hidden="true">
            {"★★★★★".split("").map((s, i) => (
              <span key={i}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <PreviewInput label="Name" required style={inputStyle} />
      <PreviewInput label="Email" required style={inputStyle} />
      {optional.map((f) => (
        <PreviewInput key={f.key} label={OPTIONAL_LABELS[f.key]} required={f.required} style={inputStyle} />
      ))}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">
          Your testimonial <Star required />
        </span>
        <textarea rows={4} disabled className="rounded-lg px-2.5 py-2 text-sm" style={inputStyle} />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" disabled className="mt-0.5" />
        <span>
          I agree to let this testimonial be shown publicly. <Star required />
        </span>
      </label>

      <button
        type="button"
        disabled
        className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium opacity-60"
        style={{ background: t.accent, color: t.accentText }}
      >
        Submit
      </button>
    </div>
  );
}

function Star({ required }: { required: boolean }) {
  return required ? (
    <span aria-hidden="true" title="Required">
      *
    </span>
  ) : null;
}

function PreviewInput({ label, required, style }: { label: string; required: boolean; style: React.CSSProperties }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        {label} <Star required={required} />
      </span>
      <input type="text" disabled className="rounded-lg px-2.5 py-1.5 text-sm" style={style} />
    </label>
  );
}
