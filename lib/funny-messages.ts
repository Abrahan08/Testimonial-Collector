export const FUNNY_MESSAGES = [
  "You just made our day. We're doing a happy dance. Imagine it. It's great.",
  "Thank you! Our hamster-powered servers are running extra fast in celebration.",
  "Testimonial received! We'd high-five you through the screen if we could.",
  "Wow, kind words! We're printing this out and sticking it on the fridge. (We don't have a printer.)",
  "Thanks! You're officially our favorite person this hour.",
  "Mic drop. Your testimonial has landed safely.",
  "Your words just gave us +10 confidence. Side effects include grinning.",
  "Delivered! A tiny confetti cannon went off somewhere in our office.",
];

export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}
