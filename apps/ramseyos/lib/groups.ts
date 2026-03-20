import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface GroupItem {
  id: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
}

export interface GroupMember {
  id: string;
  groupId: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export async function getActiveGroups(): Promise<GroupItem[]> {
  const q = query(
    collection(db, "groups"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    description: d.data().description ?? "",
    category: d.data().category ?? "",
    active: d.data().active,
  }));
}

export async function getGroupMembers(): Promise<GroupMember[]> {
  const q = query(
    collection(db, "groupMembers"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    groupId: d.data().groupId,
    name: d.data().name,
    email: d.data().email ?? "",
    role: d.data().role ?? "",
    active: d.data().active,
  }));
}

export async function seedGroups(): Promise<number> {
  const existing = await getDocs(collection(db, "groups"));
  if (existing.size > 0) return 0;

  const groups = [
    { name: "AP Chemistry", description: "Current AP Chemistry students", category: "school" },
    { name: "Honors Chemistry", description: "Current Honors Chemistry students", category: "school" },
    { name: "Parents — AP Chem", description: "Parents of AP Chemistry students", category: "school" },
    { name: "Family", description: "Immediate family contacts", category: "personal" },
    { name: "Consulting Contacts", description: "Woven and Cycles collaborators", category: "professional" },
  ];

  const groupIds: string[] = [];
  for (const g of groups) {
    const ref = await addDoc(collection(db, "groups"), {
      ...g,
      active: true,
      createdAt: serverTimestamp(),
    });
    groupIds.push(ref.id);
  }

  // Seed members
  const existingMembers = await getDocs(collection(db, "groupMembers"));
  if (existingMembers.size > 0) return groups.length;

  const members = [
    { groupId: groupIds[0], name: "Alex Rivera", email: "alex.r@example.com", role: "student" },
    { groupId: groupIds[0], name: "Jordan Chen", email: "jordan.c@example.com", role: "student" },
    { groupId: groupIds[0], name: "Mia Patel", email: "mia.p@example.com", role: "student" },
    { groupId: groupIds[1], name: "Sam Okafor", email: "sam.o@example.com", role: "student" },
    { groupId: groupIds[1], name: "Lily Tran", email: "lily.t@example.com", role: "student" },
    { groupId: groupIds[2], name: "Dr. Rivera", email: "rivera.parent@example.com", role: "parent" },
    { groupId: groupIds[2], name: "Mr. Chen", email: "chen.parent@example.com", role: "parent" },
    { groupId: groupIds[3], name: "Sarah", email: "", role: "" },
    { groupId: groupIds[3], name: "Mom", email: "", role: "" },
    { groupId: groupIds[4], name: "Dana Whitfield", email: "dana@wovenlearning.com", role: "collaborator" },
    { groupId: groupIds[4], name: "Marcus Lee", email: "marcus@cyclesoflearning.com", role: "collaborator" },
  ];

  for (const m of members) {
    await addDoc(collection(db, "groupMembers"), {
      ...m,
      active: true,
      createdAt: serverTimestamp(),
    });
  }

  return groups.length;
}
