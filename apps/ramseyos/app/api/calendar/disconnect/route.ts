import { NextResponse } from "next/server";
import { disconnectGoogle } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await disconnectGoogle();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Disconnect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
