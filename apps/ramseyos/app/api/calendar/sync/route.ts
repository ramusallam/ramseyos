import { NextResponse } from "next/server";
import { syncGoogleCalendar } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncGoogleCalendar();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
