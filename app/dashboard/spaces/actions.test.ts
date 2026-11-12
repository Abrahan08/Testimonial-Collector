import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn();
vi.mock("@/lib/db", () => ({ db: { space: { updateMany: (...a: unknown[]) => updateMany(...a) } } }));
vi.mock("@/lib/session", () => ({ requireUser: async () => ({ id: "owner-1" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
// The module also imports these; they are unused by the update action.
vi.mock("@/lib/generated/prisma/client", () => ({ Prisma: { PrismaClientKnownRequestError: class {} } }));
vi.mock("@/lib/limits", () => ({ canCreateSpace: () => true }));

import { updateSpaceAction } from "./actions";

function form(extra: Record<string, string> = {}) {
  const fd = new FormData();
  const base: Record<string, string> = {
    name: "My space",
    title: "Share your story",
    subtitle: "",
    ask: "What do you think?",
    collectRating: "on",
    theme: "dark",
    ...extra,
  };
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

describe("updateSpaceAction", () => {
  beforeEach(() => updateMany.mockReset());

  it("scopes by the signed-in owner and never writes slug or ownerId", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    await expect(
      updateSpaceAction("space-1", {}, form({ slug: "hacked", ownerId: "owner-2" })),
    ).rejects.toThrow("REDIRECT:/dashboard/spaces?updated=1");

    expect(updateMany).toHaveBeenCalledTimes(1);
    const arg = updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "space-1", ownerId: "owner-1" });
    expect(arg.data).not.toHaveProperty("slug");
    expect(arg.data).not.toHaveProperty("ownerId");
    expect(Object.keys(arg.data).sort()).toEqual(
      ["ask", "collectRating", "fields", "name", "subtitle", "theme", "title"].sort(),
    );
  });

  it("returns 404 when the space is missing or owned by someone else", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    await expect(updateSpaceAction("space-x", {}, form())).rejects.toThrow("NOT_FOUND");
  });

  it("returns field errors and does not write on invalid input", async () => {
    const r = await updateSpaceAction("space-1", {}, form({ title: "  " }));
    expect(r.fieldErrors?.title).toBeTruthy();
    expect(updateMany).not.toHaveBeenCalled();
  });
});
