import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Reads cookies/headers, so callers must render inside <Suspense>
// (cacheComponents is enabled).
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

// Authoritative check for dashboard pages; the proxy only checks the cookie exists.
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}
