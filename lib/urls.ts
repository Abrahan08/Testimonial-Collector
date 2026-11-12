// Public link of a space. APP_URL comes from the environment.
export function publicSpaceUrl(slug: string): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/s/${slug}`;
}
