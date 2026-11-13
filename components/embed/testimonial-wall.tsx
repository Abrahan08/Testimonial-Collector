"use client";

import { useRef } from "react";
import { initials } from "@/lib/inbox-query";
import type { EmbedStyleKey } from "@/lib/validators/embed";

export type WallTestimonial = {
  name: string;
  company: string | null;
  rating: number | null;
  text: string;
};

type Props = {
  testimonials: WallTestimonial[];
  style: EmbedStyleKey;
  dark: boolean;
  animation: boolean;
  /** CSS hex colour including "#". */
  bg: string;
  /** Shown when there is nothing to display. Omit to render nothing. */
  emptyMessage?: string;
};

// Static CSS, no user content. Animations are CSS only and switched off for reduced motion.
const CSS = `
.tcw{box-sizing:border-box;padding:16px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5}
.tcw *{box-sizing:border-box}
.tcw[data-dark="false"]{--tcw-fg:#18181b;--tcw-muted:#52525b;--tcw-card:rgba(0,0,0,.04);--tcw-border:rgba(0,0,0,.1);--tcw-avatar:#18181b;--tcw-avatar-fg:#fff}
.tcw[data-dark="true"]{--tcw-fg:#fafafa;--tcw-muted:#c4c4cc;--tcw-card:rgba(255,255,255,.08);--tcw-border:rgba(255,255,255,.16);--tcw-avatar:#fafafa;--tcw-avatar-fg:#0f0f12}
.tcw{color:var(--tcw-fg)}
.tcw-masonry{columns:3 260px;column-gap:16px}
.tcw-masonry .tcw-card{break-inside:avoid;margin:0 0 16px}
.tcw-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin;padding-bottom:8px}
.tcw-track .tcw-card{flex:0 0 min(340px,85%);scroll-snap-align:start}
.tcw-card{background:var(--tcw-card);border:1px solid var(--tcw-border);border-radius:12px;padding:16px}
.tcw-head{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.tcw-avatar{display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:50%;background:var(--tcw-avatar);color:var(--tcw-avatar-fg);font-weight:600;font-size:14px}
.tcw-name{font-weight:600;margin:0;font-size:15px}
.tcw-company{margin:0;font-size:13px;color:var(--tcw-muted)}
.tcw-stars{margin:0 0 6px;color:#d97706;letter-spacing:2px;font-size:16px}
.tcw[data-dark="true"] .tcw-stars{color:#fbbf24}
.tcw-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px}
.tcw-nav{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
.tcw-btn{cursor:pointer;border:1px solid var(--tcw-border);background:var(--tcw-card);color:var(--tcw-fg);border-radius:8px;padding:6px 12px;font:inherit;font-size:14px}
.tcw-btn:focus-visible{outline:2px solid var(--tcw-fg);outline-offset:2px}
.tcw-empty{margin:0;text-align:center;color:var(--tcw-muted);padding:24px 0}
@keyframes tcw-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.tcw[data-animation="true"] .tcw-card{animation:tcw-in .5s ease both;animation-delay:calc(var(--i,0) * 60ms)}
@media (prefers-reduced-motion:reduce){
.tcw .tcw-card{animation:none!important}
.tcw-track{scroll-behavior:auto}
}
`;

function Stars({ rating }: { rating: number }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <p className="tcw-stars" role="img" aria-label={`${n} out of 5 stars`}>
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </p>
  );
}

function Card({ t, index }: { t: WallTestimonial; index: number }) {
  return (
    <figure className="tcw-card" style={{ "--i": Math.min(index, 12) } as React.CSSProperties}>
      <figcaption className="tcw-head">
        <span className="tcw-avatar" aria-hidden="true">
          {initials(t.name)}
        </span>
        <span>
          <p className="tcw-name">{t.name}</p>
          {t.company && <p className="tcw-company">{t.company}</p>}
        </span>
      </figcaption>
      {t.rating != null && <Stars rating={t.rating} />}
      {/* Plain text node: React escapes it, no HTML is ever interpreted. */}
      <blockquote className="tcw-text" style={{ margin: 0 }}>
        {t.text}
      </blockquote>
    </figure>
  );
}

export function TestimonialWall({ testimonials, style, dark, animation, bg, emptyMessage }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".tcw-card");
    const step = (card?.offsetWidth ?? track.clientWidth) + 16;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: step * direction, behavior: reduced ? "auto" : "smooth" });
  }

  if (testimonials.length === 0 && !emptyMessage) return null;

  return (
    <div className="tcw" data-dark={String(dark)} data-animation={String(animation)} style={{ background: bg }}>
      <style>{CSS}</style>
      {testimonials.length === 0 ? (
        <p className="tcw-empty">{emptyMessage}</p>
      ) : style === "carousel" ? (
        <>
          <div className="tcw-track" ref={trackRef} tabIndex={0} role="region" aria-label="Testimonials">
            {testimonials.map((t, i) => (
              <Card key={i} t={t} index={i} />
            ))}
          </div>
          <div className="tcw-nav">
            <button type="button" className="tcw-btn" onClick={() => scrollByCard(-1)} aria-label="Previous testimonials">
              Previous
            </button>
            <button type="button" className="tcw-btn" onClick={() => scrollByCard(1)} aria-label="Next testimonials">
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="tcw-masonry">
          {testimonials.map((t, i) => (
            <Card key={i} t={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
