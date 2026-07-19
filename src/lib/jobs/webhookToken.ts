import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

export function signWebhookToken(jobId: string): string {
  return createHmac("sha256", getSecret()).update(jobId).digest("hex");
}

export function verifyWebhookToken(jobId: string, token: string | null): boolean {
  if (!token) return false;
  const expected = signWebhookToken(jobId);
  const expectedBuf = Buffer.from(expected);
  const tokenBuf = Buffer.from(token);
  if (expectedBuf.length !== tokenBuf.length) return false;
  return timingSafeEqual(expectedBuf, tokenBuf);
}
