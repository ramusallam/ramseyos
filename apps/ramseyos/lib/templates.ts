import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface TemplateItem {
  id: string;
  title: string;
  category: string;
  subject: string;
  body: string;
  active: boolean;
  favorite: boolean;
  linkedGroupIds: string[];
}

export async function getActiveTemplates(): Promise<TemplateItem[]> {
  const q = query(
    collection(db, "templates"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    category: d.data().category,
    subject: d.data().subject ?? "",
    body: d.data().body,
    active: d.data().active,
    favorite: d.data().favorite ?? false,
    linkedGroupIds: d.data().linkedGroupIds ?? [],
  }));
}

export async function updateTemplateFavorite(
  id: string,
  favorite: boolean
): Promise<void> {
  await updateDoc(doc(db, "templates", id), { favorite });
}

export async function seedTemplates(): Promise<number> {
  const existing = await getDocs(collection(db, "templates"));
  if (existing.size > 0) return 0;

  const seeds = [
    {
      title: "Parent Update",
      category: "school",
      subject: "Quick update from class",
      body: "Dear families,\n\nI wanted to share a quick update on what we've been working on in class this week. Students have been engaged in hands-on inquiry and I'm excited about the progress I'm seeing.\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest,\nRamsey",
    },
    {
      title: "Class Reminder",
      category: "school",
      subject: "",
      body: "Hi everyone,\n\nJust a quick reminder about our upcoming assignment. Please make sure to review the materials before our next class.\n\nLooking forward to seeing your work!",
    },
    {
      title: "Family Check-In",
      category: "personal",
      subject: "",
      body: "Hey — just checking in. Hope everyone is doing well. Let me know if there's anything you need or if you want to catch up soon.",
    },
    {
      title: "Student Follow-Up",
      category: "school",
      subject: "Following up",
      body: "Hi,\n\nI wanted to follow up on our conversation. I appreciate you taking the time to talk, and I want to make sure you have what you need to move forward.\n\nLet me know how I can help.",
    },
    {
      title: "General Outreach",
      category: "professional",
      subject: "",
      body: "Hi,\n\nI hope this message finds you well. I wanted to reach out about a potential opportunity to connect.\n\nWould love to find a time to chat if you're open to it.\n\nBest,\nRamsey",
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "templates"), {
      ...seed,
      active: true,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

export async function seedTemplatePairings(): Promise<number> {
  const templates = await getActiveTemplates();
  const alreadyPaired = templates.some((t) => t.linkedGroupIds.length > 0);
  if (alreadyPaired) return 0;

  const groupSnap = await getDocs(
    query(collection(db, "groups"), where("active", "==", true))
  );
  const groupsByName = new Map<string, string>();
  for (const d of groupSnap.docs) {
    groupsByName.set(d.data().name, d.id);
  }

  const pairings: Record<string, string[]> = {
    "Parent Update": ["Parents — AP Chem"],
    "Class Reminder": ["AP Chemistry", "Honors Chemistry"],
    "Family Check-In": ["Family"],
    "Student Follow-Up": ["AP Chemistry", "Honors Chemistry"],
    "General Outreach": ["Consulting Contacts"],
  };

  let count = 0;
  for (const t of templates) {
    const groupNames = pairings[t.title];
    if (!groupNames) continue;
    const ids = groupNames
      .map((n) => groupsByName.get(n))
      .filter((id): id is string => !!id);
    if (ids.length === 0) continue;
    await updateDoc(doc(db, "templates", t.id), { linkedGroupIds: ids });
    count++;
  }

  return count;
}
