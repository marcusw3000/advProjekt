import { describe, expect, it } from "vitest";
import { formatMs } from "./time";

describe("formatMs", () => {
  it("formats zero", () => {
    expect(formatMs(0)).toBe("0:00");
  });

  it("pads seconds under 10", () => {
    expect(formatMs(5000)).toBe("0:05");
  });

  it("formats minutes and seconds", () => {
    expect(formatMs(65_000)).toBe("1:05");
  });

  it("truncates instead of rounding", () => {
    expect(formatMs(1999)).toBe("0:01");
  });
});
