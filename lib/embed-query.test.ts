import { describe, expect, it } from "vitest";
import { EMBED_LIMIT, EMBED_ORDER, EMBED_SELECT, buildEmbedWhere } from "@/lib/embed-query";

describe("buildEmbedWhere", () => {
  it("always requires not hidden and consent", () => {
    for (const source of ["all_visible", "wall_of_love"] as const) {
      expect(buildEmbedWhere("s1", source)).toMatchObject({
        spaceId: "s1",
        isHidden: false,
        consentToShare: true,
      });
    }
  });

  it("all_visible does not filter on wall of love", () => {
    expect(buildEmbedWhere("s1", "all_visible")).not.toHaveProperty("isWallOfLove");
  });

  it("wall_of_love adds isWallOfLove", () => {
    expect(buildEmbedWhere("s1", "wall_of_love")).toMatchObject({ isWallOfLove: true });
  });
});

describe("embed select, order and limit", () => {
  it("selects only the public fields", () => {
    expect(Object.keys(EMBED_SELECT).sort()).toEqual(
      ["company", "createdAt", "isFavorite", "name", "rating", "text"].sort(),
    );
    expect(EMBED_SELECT).not.toHaveProperty("email");
    expect(EMBED_SELECT).not.toHaveProperty("consentToShare");
  });

  it("orders favorites first, then newest", () => {
    expect(EMBED_ORDER[0]).toEqual({ isFavorite: "desc" });
    expect(EMBED_ORDER[1]).toEqual({ createdAt: "desc" });
  });

  it("caps at 50", () => {
    expect(EMBED_LIMIT).toBe(50);
  });
});
