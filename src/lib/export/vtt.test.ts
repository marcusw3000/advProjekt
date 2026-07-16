import { describe, expect, it } from "vitest";
import { toVtt } from "./vtt";

describe("toVtt", () => {
  it("starts with WEBVTT header and formats times with dot millis", () => {
    const result = toVtt([{ speakerLabel: "Speaker 1", startMs: 0, endMs: 2500, text: "Ola" }]);

    expect(result).toBe("WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nSpeaker 1: Ola\n");
  });
});
