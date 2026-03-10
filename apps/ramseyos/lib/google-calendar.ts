import { google, type calendar_v3 } from "googleapis";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "calendarEvents";

interface SyncResult {
  created: number;
  updated: number;
  total: number;
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
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

export async function syncGoogleCalendar(
  accessToken: string,
  refreshToken?: string | null
): Promise<SyncResult> {
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
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
