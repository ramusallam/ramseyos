import { NextResponse } from "next/server";
import {
  getAuthUrl,
  exchangeCodeForTokens,
  storeTokens,
} from "@/lib/google-calendar";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Fetch user email for display
    let email: string | null = null;
    if (tokens.access_token) {
      try {
        const oauth2 = new google.auth.OAuth2();
        oauth2.setCredentials({ access_token: tokens.access_token });
        const people = google.oauth2({ version: "v2", auth: oauth2 });
        const me = await people.userinfo.get();
        email = me.data.email ?? null;
      } catch {
        // Non-critical — continue without email
      }
    }

    await storeTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      email,
    });

    return NextResponse.redirect(
      `${origin}/calendar?connected=true`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auth failed";
    return NextResponse.redirect(
      `${origin}/calendar?error=${encodeURIComponent(message)}`
    );
  }
}
