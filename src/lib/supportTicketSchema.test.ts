import { describe, expect, it } from "vitest";
import { supportTicketSchema } from "./supportTicketSchema";

describe("supportTicketSchema", () => {
  it("accepts a valid ticket", () => {
    const result = supportTicketSchema.safeParse({ subject: "Bug", message: "Algo quebrou" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty subject", () => {
    const result = supportTicketSchema.safeParse({ subject: "", message: "Algo quebrou" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = supportTicketSchema.safeParse({ subject: "Bug", message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a subject over the max length", () => {
    const result = supportTicketSchema.safeParse({ subject: "a".repeat(201), message: "ok" });
    expect(result.success).toBe(false);
  });

  it("trims whitespace-only values to empty and rejects them", () => {
    const result = supportTicketSchema.safeParse({ subject: "   ", message: "ok" });
    expect(result.success).toBe(false);
  });
});
