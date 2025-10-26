// src/lib/monthly.js
import { db } from "./firebase";
import {
  addDoc, collection, doc, getDoc, getDocs, setDoc,
  updateDoc, arrayUnion, arrayRemove, serverTimestamp,
  query, where, orderBy
} from "firebase/firestore";

/** Load the 6-month catalog (config/monthly_skills.months) */
export async function loadMonthlyCatalog() {
  const snap = await getDoc(doc(db, "config", "monthly_skills"));
  if (!snap.exists()) return { "1": [], "2": [], "3": [], "4": [], "5": [], "6": [] };
  const months = snap.data().months || {};
  // ensure all months exist
  for (const m of ["1","2","3","4","5","6"]) months[m] = Array.isArray(months[m]) ? months[m] : [];
  return months;
}

/** Replace entire months map (owner only) */
export async function saveMonthlyCatalog(months) {
  await setDoc(doc(db, "config", "monthly_skills"), { months }, { merge: true });
}

/** Append a skill to a month (owner) */
export async function addSkillToMonth(month, skill) {
  month = String(month);
  const ref = doc(db, "config", "monthly_skills");
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().months || {}) : {};
  const list = Array.isArray(current[month]) ? current[month] : [];
  await setDoc(ref, { months: { ...current, [month]: [...list, skill] } }, { merge: true });
}

/** Remove a skill from a month by id (owner) */
export async function removeSkillFromMonth(month, skillId) {
  month = String(month);
  const ref = doc(db, "config", "monthly_skills");
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const months = snap.data().months || {};
  const list = Array.isArray(months[month]) ? months[month] : [];
  const next = list.filter(s => s.id !== skillId);
  await setDoc(ref, { months: { ...months, [month]: next } }, { merge: true });
}

/** Check owner privilege — owners can be emails or UIDs in config/roles. */
export async function isOwner(user) {
  if (!user) return false;
  const roles = await getDoc(doc(db, "config", "roles"));
  if (!roles.exists()) return false;
  const owners = roles.data().owners || [];
  return owners.includes(user.uid) || owners.includes(user.email);
}

/** List signoffs for a probationer for a given month (desc) */
export async function listMonthlySignoffs(probationerEmail, month) {
  const q = query(
    collection(db, "monthly_skills_signoffs"),
    where("probationerEmail", "==", (probationerEmail || "").trim()),
    where("month", "==", Number(month)),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Record a signoff */
export async function recordMonthlySignoff({ probationerEmail, month, skillId, result, notes, evaluator }) {
  return addDoc(collection(db, "monthly_skills_signoffs"), {
    probationerEmail: (probationerEmail || "").trim(),
    month: Number(month),
    skillId,
    result, // "pass" | "fail"
    notes: notes || "",
    evaluatorUid: evaluator?.uid || "",
    evaluatorEmail: evaluator?.email || "",
    createdAt: serverTimestamp(),
  });
}
