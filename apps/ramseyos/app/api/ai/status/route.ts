import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    claude: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    configured: !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY),
  });
}
