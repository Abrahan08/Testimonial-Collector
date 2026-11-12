const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SUFFIX_LENGTH = 6;
const MAX_BASE_LENGTH = 40;

export function randomSuffix(length = SUFFIX_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => SUFFIX_ALPHABET[b % SUFFIX_ALPHABET.length]).join("");
}

export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/, "");
}

// kebab-case name + short random suffix. The suffix can be injected for tests.
export function generateSlug(name: string, suffix: string = randomSuffix()): string {
  const base = slugify(name) || "space";
  return `${base}-${suffix}`;
}
