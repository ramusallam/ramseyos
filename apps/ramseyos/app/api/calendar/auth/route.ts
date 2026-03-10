import { NextResponse } from "next/server";
import { getAuthUrl, exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    return NextResponse.json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auth failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
