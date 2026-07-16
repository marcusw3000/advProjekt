import { describe, expect, it } from "vitest";
import { toSrt } from "./srt";

describe("toSrt", () => {
  it("numbers cues sequentially and formats times with comma millis", () => {
    const result = toSrt([
      { speakerLabel: "Speaker 1", startMs: 0, endMs: 2500, text: "Ola" },
      { speakerLabel: "Speaker 2", startMs: 3_661_000, endMs: 3_662_000, text: "Oi" },
    ]);

    expect(result).toBe(
      "1\n00:00:00,000 --> 00:00:02,500\nSpeaker 1: Ola\n\n2\n01:01:01,000 --> 01:01:02,000\nSpeaker 2: Oi\n"
    );
  });
});
