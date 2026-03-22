import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getConnectionStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
