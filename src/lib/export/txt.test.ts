import { describe, expect, it } from "vitest";
import { toTxt } from "./txt";

describe("toTxt", () => {
  it("formats each segment with timestamp and speaker", () => {
    const result = toTxt([
      { speakerLabel: "Speaker 1", startMs: 0, endMs: 2000, text: "Ola" },
      { speakerLabel: "Speaker 2", startMs: 65_000, endMs: 68_000, text: "Oi" },
    ]);

    expect(result).toBe("[0:00] Speaker 1: Ola\n[1:05] Speaker 2: Oi");
  });

  it("returns empty string for no segments", () => {
    expect(toTxt([])).toBe("");
  });
});
