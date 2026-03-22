import { google, type calendar_v3 } from "googleapis";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "calendarEvents";
const TOKEN_DOC = "settings/googleCalendar";

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

export interface GoogleCalendarStatus {
  connected: boolean;
  lastSyncedAt: Date | null;
  email: string | null;
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

/* ── Token persistence ── */

export async function storeTokens(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  email?: string | null;
}): Promise<void> {
  const data: Record<string, unknown> = {
    connectedAt: serverTimestamp(),
  };
  if (tokens.access_token) data.accessToken = tokens.access_token;
  if (tokens.refresh_token) data.refreshToken = tokens.refresh_token;
  if (tokens.expiry_date) data.expiresAt = tokens.expiry_date;
  if (tokens.email) data.email = tokens.email;

  await setDoc(doc(db, TOKEN_DOC), data, { merge: true });
}

export async function getStoredTokens(): Promise<{
  accessToken: string;
  refreshToken: string | null;
} | null> {
  const snap = await getDoc(doc(db, TOKEN_DOC));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d.accessToken) return null;
  return {
    accessToken: d.accessToken,
    refreshToken: d.refreshToken ?? null,
  };
}

export async function getConnectionStatus(): Promise<GoogleCalendarStatus> {
  const snap = await getDoc(doc(db, TOKEN_DOC));
  if (!snap.exists() || !snap.data().accessToken) {
    return { connected: false, lastSyncedAt: null, email: null };
  }
  const d = snap.data();
  return {
    connected: true,
    lastSyncedAt: d.lastSyncedAt?.toDate() ?? null,
    email: d.email ?? null,
  };
}

export async function disconnectGoogle(): Promise<void> {
  await setDoc(doc(db, TOKEN_DOC), {
    accessToken: null,
    refreshToken: null,
    email: null,
    disconnectedAt: serverTimestamp(),
  });
}

/* ── Sync ── */

export async function syncGoogleCalendar(
  accessToken?: string,
  refreshToken?: string | null
): Promise<SyncResult> {
  let at = accessToken;
  let rt = refreshToken;

  if (!at) {
    const stored = await getStoredTokens();
    if (!stored) throw new Error("Not connected to Google Calendar");
    at = stored.accessToken;
    rt = stored.refreshToken;
  }

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: at,
    refresh_token: rt ?? undefined,
  });

  // Handle token refresh — save new tokens if refreshed
  oauth2.on("tokens", async (newTokens) => {
    const updates: Record<string, unknown> = {};
    if (newTokens.access_token) updates.accessToken = newTokens.access_token;
    if (newTokens.refresh_token) updates.refreshToken = newTokens.refresh_token;
    if (newTokens.expiry_date) updates.expiresAt = newTokens.expiry_date;
    if (Object.keys(updates).length > 0) {
      await setDoc(doc(db, TOKEN_DOC), updates, { merge: true });
    }
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = res.data.items ?? [];
  let created = 0;
  let updated = 0;

  for (const event of events) {
    if (!event.id || !event.summary) continue;

    const startTime = parseEventTime(event.start);
    const endTime = parseEventTime(event.end);
    if (!startTime || !endTime) continue;

    const existing = await findByGoogleEventId(event.id);

    if (existing) {
      await updateDoc(doc(db, COLLECTION, existing.id), {
        title: event.summary,
        startTime,
        endTime,
        lastSyncedAt: serverTimestamp(),
      });
      updated++;
    } else {
      await addDoc(collection(db, COLLECTION), {
        title: event.summary,
        startTime,
        endTime,
        source: "google",
        googleEventId: event.id,
        lastSyncedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      created++;
    }
  }

  // Update last sync timestamp on settings doc
  await setDoc(doc(db, TOKEN_DOC), { lastSyncedAt: serverTimestamp() }, { merge: true });

  return { created, updated, total: events.length };
}

function parseEventTime(
  time: calendar_v3.Schema$EventDateTime | undefined
): Date | null {
  if (!time) return null;
  if (time.dateTime) return new Date(time.dateTime);
  if (time.date) return new Date(time.date);
  return null;
}

async function findByGoogleEventId(
  googleEventId: string
): Promise<{ id: string } | null> {
  const q = query(
    collection(db, COLLECTION),
    where("googleEventId", "==", googleEventId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id };
}
