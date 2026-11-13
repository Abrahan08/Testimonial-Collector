// Public link of a space. APP_URL comes from the environment.
export function appBaseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function publicSpaceUrl(slug: string): string {
  return `${appBaseUrl()}/s/${slug}`;
}
