import { NextResponse } from "next/server";
import { finalizeJobFromAsr } from "@/lib/jobs/finalizeJob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  await finalizeJobFromAsr(jobId);

  return NextResponse.json({ ok: true });
}
