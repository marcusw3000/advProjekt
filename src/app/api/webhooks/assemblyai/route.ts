import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { finalizeJobFromAsr } from "@/lib/jobs/finalizeJob";
import { verifyWebhookToken } from "@/lib/jobs/webhookToken";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const token = searchParams.get("token");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  if (!verifyWebhookToken(jobId, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await finalizeJobFromAsr(jobId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, { tags: { jobId } });
    return NextResponse.json({ error: "Failed to finalize job" }, { status: 500 });
  }
}
