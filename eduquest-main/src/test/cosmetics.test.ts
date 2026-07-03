import { describe, it, expect } from "vitest";
import { ALL_COSMETICS } from "../data/cosmetics";
import { getStableUuid } from "../lib/utils";

describe("Cosmetics Database Verification", () => {
  it("should generate a valid and unique stable UUID for every cosmetic item", () => {
    const uuids = new Set<string>();
    
    ALL_COSMETICS.forEach((item) => {
      const uuid = getStableUuid(item.id);
      
      // Ensure the generated UUID is a valid UUID-like string format
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      
      // Ensure no collision exists between distinct item IDs
      if (uuids.has(uuid)) {
        throw new Error(`UUID Collision detected! Multiple items map to UUID: ${uuid} (Item: ${item.id})`);
      }
      uuids.add(uuid);
    });

    expect(uuids.size).toBe(ALL_COSMETICS.length);
  });

  it("should have correct properties and valid prices for all items", () => {
    ALL_COSMETICS.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.description).toBeDefined();
      expect(item.rarity).toBeDefined();
      expect(item.category).toBeDefined();
      expect(item.price).toBeGreaterThanOrEqual(0);
      expect(item.icon).toBeDefined();
      expect(item.gender).toBeDefined();
    });
  });
});
