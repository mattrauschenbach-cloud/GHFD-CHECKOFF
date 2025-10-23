// src/lib/driver.js
import { db } from "./firebase";
import {
  addDoc, collection, doc, getDoc, getDocs,
  query, where, orderBy, serverTimestamp
} from "firebase/firestore";

/** Record a driver check-off result */
export async function recordDriverSignoff({ userId, taskId, result, notes, evaluatorId }) {
  return addDoc(collection(db, "driver_signoffs"), {
    userId,
    taskId,
    result,                 // "pass" | "fail"
    notes: notes || "",
    evaluatorId,
    createdAt: serverTimestamp(),
  });
}

/** Load the driver task catalog from config/driver_tasks.items */
export async function getDriverTasks() {
  const ref = doc(db, "config", "driver_tasks");
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().items || []) : [];
}

/** Simple roster lookup; if shift provided, filter by shift, else active users */
export async function searchUsersByShift(shift) {
  const base = collection(db, "users");
  const q = shift
    ? query(base, where("shift", "==", shift))
    : query(base, where("isActive", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Recent signoffs for a user (newest first) */
export async function getDriverSignoffs(userId) {
  const q = query(
    collection(db, "driver_signoffs"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
