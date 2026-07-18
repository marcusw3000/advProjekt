import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMinutesBalance } from "@/lib/minutes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const minutesBalance = await getMinutesBalance(session.user.id);
  return NextResponse.json({ minutesBalance });
}
