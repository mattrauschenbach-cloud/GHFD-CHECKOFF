// src/lib/monthly.js
import { db } from "./firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";

/**
 * Shape:
 * config/monthly_skills = {
 *   months: {
 *     "1": [{ id, title, details? }, ...],
 *     "2": [...],
 *     ...
 *     "6": [...]
 *   }
 * }
 *
 * config/roles = {
 *   owners: ["ownerEmailOrUid", ...]
 * }
 *
 * monthly_skills_signoffs = collection of {
 *   probationerEmail, month(1-6), skillId, result("pass"|"fail"),
 *   notes, evaluatorUid, evaluatorEmail, createdAt
 * }
 */

// -------- Catalog (Months 1..6) --------

/** Load the 6-month catalog (ensures all months exist). */
export async function loadMonthlyCatalog() {
  const ref = doc(db, "config", "monthly_skills");
  const snap = await getDoc(ref);
  const empty = { "1": [], "2": [], "3": [], "4": [], "5": [], "6": [] };
  if (!snap.exists()) return empty;
  const months = snap.data().months || {};
  for (const m of ["1", "2", "3", "4", "5", "6"]) {
    if (!Array.isArray(months[m])) months[m] = [];
  }
  return { ...empty, ...months };
}

/** Replace the entire months map (owner only). */
export async function saveMonthlyCatalog(months) {
  const ref = doc(db, "config", "monthly_skills");
  await setDoc(ref, { months }, { merge: true });
}

/** Append a skill to a month (owner). Skill: { id, title, details? } */
export async function addSkillToMonth(month, skill) {
  month = String(month);
  const ref = doc(db, "config", "monthly_skills");
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().months || {}) : {};
  const list = Array.isArray(current[month]) ? current[month] : [];
  await setDoc(ref, { months: { ...current, [month]: [...list, skill] } }, { merge: true });
}

/** Remove a skill from a month by id (owner). */
export async function removeSkillFromMonth(month, skillId) {
  month = String(month);
  const ref = doc(db, "config", "monthly_skills");
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const months = snap.data().months || {};
  const list = Array.isArray(months[month]) ? months[month] : [];
  const next = list.filter((s) => s.id !== skillId);
  await setDoc(ref, { months: { ...months, [month]: next } }, { merge: true });
}

/** Edit an existing skill in a month by id (owner). patch: { title?, details? } */
export async function updateSkillInMonth(month, skillId, patch) {
  month = String(month);
  const ref = doc(db, "config", "monthly_skills");
  const snap = await getDoc(ref);
  const months = snap.exists() ? (snap.data().months || {}) : {};
  const list = Array.isArray(months[month]) ? months[month] : [];
  const idx = list.findIndex((s) => s.id === skillId);
  if (idx === -1) return;
  const next = [...list];
  next[idx] = { ...next[idx], ...patch };
  await setDoc(ref, { months: { ...months, [month]: next } }, { merge: true });
}

/** Reorder a skill up/down (delta = -1 or +1) within a month (owner). */
export async function moveSkillInMonth(month, skillId, delta) {
  month = String(month);
  const ref = doc(db, "config", "monthly_skills");
  const snap = await getDoc(ref);
  const months = snap.exists() ? (snap.data().months || {}) : {};
  const list = Array.isArray(months[month]) ? months[month] : [];
  const idx = list.findIndex((s) => s.id === skillId);
  if (idx === -1) return;
  const nextIdx = idx + delta;
  if (nextIdx < 0 || nextIdx >= list.length) return;
  const next = [...list];
  const [item] = next.splice(idx, 1);
  next.splice(nextIdx, 0, item);
  await setDoc(ref, { months: { ...months, [month]: next } }, { merge: true });
}

// -------- Ownership --------

/**
 * Owners are stored in config/roles.owners (array of emails or UIDs).
 * Returns boolean.
 */
export async function isOwner(user) {
  if (!user) return false;
  const ref = doc(db, "config", "roles");
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const owners = snap.data().owners || [];
  return owners.includes(user.uid) || owners.includes(user.email);
}

// -------- Signoffs --------

/** List signoffs for a probationer & month (newest first). */
export async function listMonthlySignoffs(probationerEmail, month) {
  const q = query(
    collection(db, "monthly_skills_signoffs"),
    where("probationerEmail", "==", (probationerEmail || "").trim()),
    where("month", "==", Number(month)),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Record a signoff result.
 * params: { probationerEmail, month(1-6), skillId, result("pass"|"fail"), notes?, evaluator:{uid,email}? }
 */
export async function recordMonthlySignoff({
  probationerEmail,
  month,
  skillId,
  result,
  notes,
  evaluator,
}) {
  return addDoc(collection(db, "monthly_skills_signoffs"), {
    probationerEmail: (probationerEmail || "").trim(),
    month: Number(month),
    skillId,
    result,
    notes: notes || "",
    evaluatorUid: evaluator?.uid || "",
    evaluatorEmail: evaluator?.email || "",
    createdAt: serverTimestamp(),
  });
}
