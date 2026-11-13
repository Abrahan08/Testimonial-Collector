import type { EmbedOptions } from "@/lib/validators/embed";

// Escapes a value for use inside a double-quoted HTML attribute.
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function trimBase(appUrl: string) {
  return appUrl.replace(/\/+$/, "");
}

// The iframe URL cannot carry "#" (it would start the fragment), so bg goes in without it.
function bgDigits(bg: string) {
  return bg.replace(/^#/, "");
}

export function buildEmbedUrl(appUrl: string, slug: string, o: EmbedOptions): string {
  const q = [
    `style=${encodeURIComponent(o.style)}`,
    `dark=${encodeURIComponent(String(o.dark))}`,
    `animation=${encodeURIComponent(String(o.animation))}`,
    `bg=${encodeURIComponent(bgDigits(o.bg))}`,
  ].join("&");
  return `${trimBase(appUrl)}/embed/${encodeURIComponent(slug)}?${q}`;
}

// The slug goes through encodeURIComponent, then the whole thing is attribute-escaped.
export function buildScriptSnippet(appUrl: string, slug: string, o: EmbedOptions): string {
  const src = `${trimBase(appUrl)}/embed.js`;
  const attrs = [
    `src="${escapeAttr(src)}"`,
    `data-space="${escapeAttr(encodeURIComponent(slug))}"`,
    `data-style="${escapeAttr(encodeURIComponent(o.style))}"`,
    `data-dark="${escapeAttr(encodeURIComponent(String(o.dark)))}"`,
    `data-animation="${escapeAttr(encodeURIComponent(String(o.animation)))}"`,
    `data-bg="${escapeAttr(o.bg)}"`,
  ];
  return `<script ${attrs.join(" ")}></script>`;
}

export function buildIframeSnippet(appUrl: string, slug: string, o: EmbedOptions): string {
  const [path, query] = buildEmbedUrl(appUrl, slug, o).split("?");
  // The query holds only encodeURIComponent output joined by "&", so it needs no HTML escaping
  // beyond the apostrophe; keeping a plain "&" matches the PRD snippet and pastes cleanly.
  const safeQuery = query.replace(/'/g, "%27");
  return `<iframe src="${escapeAttr(path)}?${safeQuery}" width="100%" style="border:0"></iframe>`;
}
