import { describe, expect, it } from "vitest";
import { DEMO_WATCHLIST, nameSimilarity, phoneticKey, screenName } from "./watchlist";

describe("watchlist screening (demonstration data)", () => {
  it("is entirely fictional and says so", () => {
    for (const e of DEMO_WATCHLIST) {
      expect(e.id).toMatch(/^DEMO-WL-/);
      expect(e.listing).toMatch(/Demonstration/);
    }
  });

  it("lets transliterations meet", () => {
    expect(phoneticKey("Rashed")).toBe(phoneticKey("Rashid"));
    expect(phoneticKey("Kamaal")).toBe(phoneticKey("Kamal"));
    expect(phoneticKey("Hasan")).toBe(phoneticKey("Hassan"));
  });

  it("surfaces a resembling name for a closer look, in any word order", () => {
    const hits = screenName("HASAN RASHED KAMAAL");
    expect(hits[0]?.entry.id).toBe("DEMO-WL-0219");
    expect(hits[0].similarity).toBe(1);
  });

  it("does not flag unrelated names", () => {
    expect(screenName("Rehan Tariq Malik")).toEqual([]);
    expect(screenName("Farah Nadeem Siddiqui")).toEqual([]);
    expect(nameSimilarity("Daniel Kwame Mensah", "Bastian Krell Udovic")).toBe(0);
  });
});
