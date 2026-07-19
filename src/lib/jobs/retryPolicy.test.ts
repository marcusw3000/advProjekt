import { describe, expect, it } from "vitest";
import { getBackoffMs, shouldRetry, MAX_ATTEMPTS } from "./retryPolicy";

describe("shouldRetry", () => {
  it("allows retry while under the max", () => {
    expect(shouldRetry(0)).toBe(true);
    expect(shouldRetry(1)).toBe(true);
    expect(shouldRetry(2)).toBe(true);
  });

  it("stops once attempts reach the max", () => {
    expect(shouldRetry(MAX_ATTEMPTS)).toBe(false);
    expect(shouldRetry(MAX_ATTEMPTS + 1)).toBe(false);
  });
});

describe("getBackoffMs", () => {
  it("returns 5 minutes for the first attempt", () => {
    expect(getBackoffMs(0)).toBe(5 * 60 * 1000);
  });

  it("returns 15 minutes for the second attempt", () => {
    expect(getBackoffMs(1)).toBe(15 * 60 * 1000);
  });

  it("returns 45 minutes for the third attempt", () => {
    expect(getBackoffMs(2)).toBe(45 * 60 * 1000);
  });

  it("falls back to the longest backoff beyond the known schedule", () => {
    expect(getBackoffMs(10)).toBe(45 * 60 * 1000);
  });
});
