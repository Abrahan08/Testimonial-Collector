import { describe, expect, it } from "vitest";
import {
  buildInboxOrder,
  buildInboxWhere,
  clampPage,
  countWarning,
  inboxHref,
  initials,
  isOwnedBy,
  pageToSkip,
  pickSpace,
  totalPages,
} from "./inbox-query";

describe("buildInboxWhere", () => {
  it("always scopes to the space", () => {
    expect(buildInboxWhere({ spaceId: "s1", status: "all", q: "" })).toEqual({ spaceId: "s1" });
  });

  it("maps each status to its flag", () => {
    expect(buildInboxWhere({ spaceId: "s1", status: "favorites", q: "" })).toMatchObject({ isFavorite: true });
    expect(buildInboxWhere({ spaceId: "s1", status: "wall", q: "" })).toMatchObject({ isWallOfLove: true });
    expect(buildInboxWhere({ spaceId: "s1", status: "hidden", q: "" })).toMatchObject({ isHidden: true });
  });

  it("searches name or text, case-insensitive, trimmed", () => {
    const w = buildInboxWhere({ spaceId: "s1", status: "all", q: "  Great " });
    expect(w.OR).toEqual([
      { name: { contains: "Great", mode: "insensitive" } },
      { text: { contains: "Great", mode: "insensitive" } },
    ]);
  });

  it("ignores a blank search and combines with status", () => {
    expect(buildInboxWhere({ spaceId: "s1", status: "all", q: "   " })).not.toHaveProperty("OR");
    expect(buildInboxWhere({ spaceId: "s1", status: "hidden", q: "x" })).toMatchObject({ isHidden: true, spaceId: "s1" });
  });
});

describe("order and paging", () => {
  it("pins favorites then newest first", () => {
    expect(buildInboxOrder()).toEqual([{ isFavorite: "desc" }, { createdAt: "desc" }, { id: "desc" }]);
  });

  it("computes pages of 20", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(20)).toBe(1);
    expect(totalPages(21)).toBe(2);
    expect(pageToSkip(1)).toBe(0);
    expect(pageToSkip(3)).toBe(40);
    expect(clampPage(99, 45)).toBe(3);
    expect(clampPage(0, 45)).toBe(1);
  });
});

describe("countWarning", () => {
  it("is none below 90%", () => {
    expect(countWarning("free", 89).level).toBe("none");
  });
  it("warns at 90% and above, full at the limit", () => {
    expect(countWarning("free", 90)).toEqual({ level: "warning", used: 90, limit: 100 });
    expect(countWarning("free", 99).level).toBe("warning");
    expect(countWarning("free", 100).level).toBe("full");
    expect(countWarning("free", 120).level).toBe("full");
  });
  it("uses the plan's limit", () => {
    expect(countWarning("pro", 899).level).toBe("none");
    expect(countWarning("pro", 900).level).toBe("warning");
    expect(countWarning("pro", 1000).level).toBe("full");
  });
});

describe("isOwnedBy", () => {
  it("only matches the owner", () => {
    expect(isOwnedBy({ ownerId: "u1" }, "u1")).toBe(true);
    expect(isOwnedBy({ ownerId: "u1" }, "u2")).toBe(false);
    expect(isOwnedBy(null, "u1")).toBe(false);
    expect(isOwnedBy(undefined, "u1")).toBe(false);
  });
});

describe("pickSpace", () => {
  const spaces = [{ id: "new" }, { id: "old" }];
  it("defaults to the newest", () => expect(pickSpace(spaces, undefined)?.id).toBe("new"));
  it("uses a requested owned space", () => expect(pickSpace(spaces, "old")?.id).toBe("old"));
  it("falls back for a space the owner does not have", () => expect(pickSpace(spaces, "foreign")?.id).toBe("new"));
  it("returns null with no spaces", () => expect(pickSpace([], "x")).toBeNull());
});

describe("helpers", () => {
  it("builds hrefs, omitting defaults", () => {
    expect(inboxHref({})).toBe("/dashboard/inbox");
    expect(inboxHref({ space: "s1", status: "all", page: 1 })).toBe("/dashboard/inbox?space=s1");
    expect(inboxHref({ space: "s1", status: "hidden", q: "a b", page: 2 })).toBe(
      "/dashboard/inbox?space=s1&status=hidden&q=a+b&page=2",
    );
  });
  it("makes initials", () => {
    expect(initials("ava johnson")).toBe("AJ");
    expect(initials("Cher")).toBe("C");
    expect(initials("  ")).toBe("?");
  });
});
