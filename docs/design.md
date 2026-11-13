# Design: Clear Signal
Crisp, calm, instrument-panel precision. The dashboard is a tool: scan fast, act fast. Personality lives in
headings, numbers and one blue. Space themes (lib/themes.ts) style only the public page and embed, never the dashboard.

## Fonts (next/font/google only)
- Heading: Bricolage Grotesque, 600, tracking -0.01em, only at 20px and up. Var `--font-heading`.
- Body/UI: Figtree, 400/500/600. Var `--font-sans`. Mono: Geist Mono (existing), code and IDs only.
- Numbers in stats and tables use `tabular-nums`. Sentence case everywhere, no all-caps labels.

## Type scale (px / line-height)
12/16 caption · 14/20 dashboard body · 16/24 public body · 20/28 h3 · 24/32 h2 · 32/40 h1 · 44/48 public hero.
Line length under 70ch. Testimonial text is body size, never smaller than 14.

## Color tokens (oklch, names from app/globals.css)
Light: background .985 .004 260 · foreground .2 .03 265 · card/popover 1 0 0 · primary .45 .19 267 ·
primary-foreground .985 .004 260 · secondary .955 .012 262 · muted .955 .008 260 · muted-foreground .48 .02 262 ·
accent .93 .035 268 · accent-foreground .3 .12 267 · destructive .55 .22 27 · border .9 .01 262 ·
input .62 .02 262 · ring .55 .19 267 · sidebar .97 .008 260 (sidebar-primary = primary).
Dark: background .17 .025 265 · foreground .96 .005 260 · card/popover .21 .03 265 · primary .72 .14 268 ·
primary-foreground .17 .025 265 · secondary/muted/accent .27 .03 265 · muted-foreground .72 .02 262 ·
destructive .7 .19 22 · border 1 0 0 / 12% · input .55 .03 265 · ring .72 .14 268 · sidebar .19 .028 265.
Charts: chart-1 primary, chart-2 teal, chart-3 amber, chart-4 magenta, chart-5 slate, each AA on card.
Contrast floor: text 4.5:1, large text and input borders/icons 3:1. Verify every new pair.

## Spacing and radius
4px base: 4/8/12/16/24/32/48. Gutter 16 mobile, 24 desktop. Card padding 20. Max content width 1120.
`--radius: 0.5rem`. Inputs and buttons use md, cards lg, public quote cards xl, badges full.

## Components
- Button: one solid primary per view. Secondary is outline, ghost for toolbars and nav. Height 36 dashboard,
  44 public (touch). Verb labels ("Save changes"). Destructive only inside a confirm dialog.
- Card: bg-card, 1px border, no shadow at rest, no card inside a card. Shadow only on popovers and dialogs.
- Input: label above, always visible. Border meets 3:1. Error text under the field in destructive color
  with an icon. Helper text in muted-foreground. Height 40, public 44.
- Badge: rounded-full, 12px medium. Neutral is secondary. Status uses tint plus text label, never color alone.
- Active nav: accent background plus aria-current, not weight alone.
- Focus: 2px ring with 2px offset on every interactive element, never removed.

## Motion
- 150ms ease-out for hover, focus, toggle. 200ms for dialog and popover open and close.
- One orchestrated moment: the public form's "Thank you" confirmation. No scroll or page-load entrances.
- `prefers-reduced-motion: reduce`: drop transforms and durations to 0, keep instant state changes.

## Don't
- No hardcoded hex/rgb/oklch in components. Use variables or Tailwind token classes.
- No gradients, glow, glass, or decorative shadows. No all-caps eyebrows.
- No second accent color in the dashboard. No heading font below 20px.
- No Space theme colors in the dashboard. Theme accents must pass AA against accentText.
- No new fonts, icon sets or UI libraries. No hover lift on cards.
