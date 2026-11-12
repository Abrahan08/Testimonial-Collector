import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn();
const deleteMany = vi.fn();
const findFirst = vi.fn();
const revalidatePath = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    testimonial: {
      updateMany: (...a: unknown[]) => updateMany(...a),
      deleteMany: (...a: unknown[]) => deleteMany(...a),
      findFirst: (...a: unknown[]) => findFirst(...a),
    },
  },
}));
vi.mock("@/lib/session", () => ({ requireUser: async () => ({ id: "owner-1" }) }));
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import {
  deleteTestimonialAction,
  editTestimonialAction,
  setFavoriteAction,
  setHiddenAction,
  setWallOfLoveAction,
} from "./actions";

const ownedWhere = { id: "t1", space: { ownerId: "owner-1" } };

describe("inbox actions", () => {
  beforeEach(() => {
    updateMany.mockReset();
    deleteMany.mockReset();
    findFirst.mockReset();
    revalidatePath.mockReset();
  });

  it.each([
    ["favorite", setFavoriteAction, "isFavorite"],
    ["wall of love", setWallOfLoveAction, "isWallOfLove"],
    ["hidden", setHiddenAction, "isHidden"],
  ] as const)("%s toggle is owner scoped and revalidates", async (_n, action, field) => {
    updateMany.mockResolvedValue({ count: 1 });
    await action({ id: "t1", value: true });
    expect(updateMany).toHaveBeenCalledWith({ where: ownedWhere, data: { [field]: true } });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/inbox");
  });

  it("404s on a toggle for someone else's testimonial and does not revalidate", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    await expect(setFavoriteAction({ id: "t1", value: true })).rejects.toThrow("NOT_FOUND");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("404s on a malformed id without touching the database", async () => {
    await expect(setHiddenAction({ id: "", value: true })).rejects.toThrow("NOT_FOUND");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("delete is owner scoped and 404s when nothing matches", async () => {
    deleteMany.mockResolvedValueOnce({ count: 1 });
    await deleteTestimonialAction({ id: "t1" });
    expect(deleteMany).toHaveBeenCalledWith({ where: ownedWhere });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/inbox");
    deleteMany.mockResolvedValueOnce({ count: 0 });
    await expect(deleteTestimonialAction({ id: "t1" })).rejects.toThrow("NOT_FOUND");
  });

  it("edit writes only name, text and rating, scoped by owner", async () => {
    findFirst.mockResolvedValue({ id: "t1", space: { collectRating: true } });
    updateMany.mockResolvedValue({ count: 1 });
    const result = await editTestimonialAction({
      id: "t1",
      name: " Ava ",
      text: "Nice",
      rating: 4,
      // Extra keys from a forged client must never reach the database.
      ...({ email: "x@y.com", spaceId: "other" } as object),
    });
    expect(result).toEqual({ ok: true });
    expect(findFirst.mock.calls[0][0].where).toEqual(ownedWhere);
    expect(updateMany).toHaveBeenCalledWith({ where: ownedWhere, data: { name: "Ava", text: "Nice", rating: 4 } });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/inbox");
  });

  it("edit ignores rating when the space does not collect ratings", async () => {
    findFirst.mockResolvedValue({ id: "t1", space: { collectRating: false } });
    updateMany.mockResolvedValue({ count: 1 });
    await editTestimonialAction({ id: "t1", name: "Ava", text: "Nice", rating: 5 });
    expect(updateMany.mock.calls[0][0].data).toEqual({ name: "Ava", text: "Nice" });
  });

  it("edit returns field errors for invalid input and does not query", async () => {
    const result = await editTestimonialAction({ id: "t1", name: "", text: "x".repeat(1001), rating: 9 });
    expect(result.fieldErrors?.name).toBeTruthy();
    expect(result.fieldErrors?.text).toBeTruthy();
    expect(result.fieldErrors?.rating).toBeTruthy();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("edit 404s for a foreign testimonial", async () => {
    findFirst.mockResolvedValue(null);
    await expect(editTestimonialAction({ id: "t1", name: "A", text: "b" })).rejects.toThrow("NOT_FOUND");
    expect(updateMany).not.toHaveBeenCalled();
  });
});
