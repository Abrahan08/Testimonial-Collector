"use client";

import { useActionState, useState } from "react";
import { PublicFormView, type PublicFormField } from "@/components/space/public-form-view";
import { FUNNY_MESSAGES, pickRandom } from "@/lib/funny-messages";
import { THEMES, type ThemeKey } from "@/lib/themes";
import type { SubmitState } from "@/app/s/[slug]/actions";

type Props = {
  title: string;
  subtitle: string;
  ask: string;
  collectRating: boolean;
  theme: ThemeKey;
  fields: PublicFormField[];
  // URLs of image files found in public/gifs/ (may be empty).
  gifs: string[];
  action: (prev: SubmitState, formData: FormData) => Promise<SubmitState>;
  closedMessage: string;
};

const CONFETTI = ["🎉", "✨", "🎊", "⭐", "💖", "🥳"];

export function PublicFormClient({ gifs, action, closedMessage, ...view }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as SubmitState);
  // Picked once per visit so the confirmation doesn't change on re-render.
  const [message] = useState(() => pickRandom(FUNNY_MESSAGES) ?? "Thank you!");
  const [gif] = useState(() => pickRandom(gifs));
  const t = THEMES[view.theme] ?? THEMES.light;

  if (state.ok) {
    return (
      <div
        data-testid="confirmation"
        className="relative flex flex-col items-center gap-4 overflow-hidden rounded-xl p-8 text-center"
        style={{ background: t.background, color: t.text, border: `1px solid ${t.border}` }}
      >
        <h2 className="text-xl font-semibold">Thank you!</h2>
        <p className="text-base break-words">{message}</p>
        {gif ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gif} alt="" className="max-h-64 rounded-lg" />
        ) : (
          <Confetti />
        )}
      </div>
    );
  }

  if (state.closed) {
    return <ClosedNotice message={closedMessage} theme={view.theme} />;
  }

  return (
    <PublicFormView
      {...view}
      interactive={{
        action: formAction,
        pending,
        fieldErrors: state.fieldErrors,
        formError: state.formError,
        values: state.values,
      }}
    />
  );
}

export function ClosedNotice({ message, theme }: { message: string; theme: ThemeKey }) {
  const t = THEMES[theme] ?? THEMES.light;
  return (
    <div
      data-testid="space-closed"
      className="rounded-xl p-8 text-center"
      style={{ background: t.background, color: t.text, border: `1px solid ${t.border}` }}
    >
      <p className="text-base">{message}</p>
    </div>
  );
}

// Pure CSS/emoji fallback used when public/gifs/ has no images.
function Confetti() {
  return (
    <div aria-hidden="true" data-testid="confetti" className="relative h-32 w-full">
      <style>{`
        @keyframes confetti-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0 }
          15% { opacity: 1 } 100% { transform: translateY(120px) rotate(360deg); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .confetti-piece { animation: none !important; opacity: 1 !important } }
      `}</style>
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="confetti-piece absolute text-2xl"
          style={{
            left: `${(i * 100) / 18 + 2}%`,
            top: 0,
            opacity: 0,
            animation: `confetti-fall ${2 + (i % 5) * 0.4}s ease-in ${(i % 6) * 0.2}s infinite`,
          }}
        >
          {CONFETTI[i % CONFETTI.length]}
        </span>
      ))}
    </div>
  );
}
