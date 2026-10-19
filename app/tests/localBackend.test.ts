import { describe, expect, it } from "vitest";
import { applyFieldUpdates } from "../src/data/localBackend";
import { arrayUnion } from "../src/data/backend";

describe("applyFieldUpdates", () => {
  it("점 표기 경로로 중첩 필드를 갱신하고 다른 목원 기록은 그대로 둔다", () => {
    const doc = { entries: { a: { prayer: "x" }, b: { prayer: "y" } } };
    const next = applyFieldUpdates(doc, { "entries.a": { prayer: "z" } });
    expect(next).toEqual({ entries: { a: { prayer: "z" }, b: { prayer: "y" } } });
    expect(doc.entries.a.prayer).toBe("x");
  });

  it("arrayUnion은 중복 없이 추가한다", () => {
    expect(applyFieldUpdates({ ids: ["a"] }, { ids: arrayUnion("a", "b") })).toEqual({ ids: ["a", "b"] });
  });
});
