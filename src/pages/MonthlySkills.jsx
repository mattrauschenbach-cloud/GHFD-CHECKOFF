import { useMemo, useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Simple starter for monthly skills:
 * - Choose month & probationer (email text input for now)
 * - Quick list of skills (local array) with Pass/Fail + notes
 * - Writes to Firestore: collection "monthly_skills_signoffs"
 *
 * You can later:
 * - Replace the email text box with a select fed by /users like Driver page
 * - Move SKILLS to Firestore config (config/monthly_skills.items)
 */

const SKILLS = [
  { id: "scba_don",       title: "SCBA Donning",         details: "Don and seal within time standard" },
  { id: "scba_doff",      title: "SCBA Doffing",         details: "Doff safely and stow properly" },
  { id: "mask_up",        title: "Mask Up (Blackout)",   details: "Mask up with limited visibility" },
  { id: "ladders_raise",  title: "Ladders – Raise",      details: "Single-/two-firefighter raises" },
  { id: "rit_search",     title: "RIT/Search",           details: "Grid/Oriented search, victim locate" },
  { id: "self_rescue",    title: "Self-Rescue/Mayday",   details: "Window bail, ladder bail, radio call" },
  { id: "engine_ops",     title: "Engine Ops",           details: "Stretch, charge, nozzle control" },
  { id: "extrication",    title: "Extrication Basics",   details: "Stabilize, crib, tool safety" },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function MonthlySkills({ user }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [year, setYear]   = useState(today.getFullYear());
  const [probEmail, setProbEmail] = useState(""); // quick input for now
  const [notes, setNotes] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Load existing signoffs for the chosen month/probationer (display small history)
  const [recent, setRecent] = useState([]);

  const monthKey = useMemo(() => `${year}-${String(month+1).padStart(2,"0")}`, [month, year]);

  useEffect(() => { (async () => {
    if (!probEmail) { setRecent([]); return; }
    // Pull this month’s entries for that probationer
    const start = new Date(year, month, 1, 0,0,0);
    const end   = new Date(year, month+1, 0, 23,59,59);
    const q = query(
      collection(db, "monthly_skills_signoffs"),
      where("probationerEmail", "==", probEmail),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setRecent(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  })(); }, [probEmail, monthKey]);

  async function record(skillId, result) {
    if (!probEmail) { alert("Enter the probationer’s email first."); return; }
    setBusyId(`${skillId}-${result}`);
    try {
      await addDoc(collection(db, "monthly_skills_signoffs"), {
        monthKey,              // e.g. "2025-10"
        year,
        month,                 // 0-11
        probationerEmail: probEmail.trim(),
        evaluatorUid: user?.uid || "",
        evaluatorEmail: user?.email || "",
        skillId,
        result,                // "pass" | "fail"
        notes: notes || "",
        createdAt: serverTimestamp(),
      });
      setNotes("");
      // refresh list
      const start = new Date(year, month, 1, 0,0,0);
      const end   = new Date(year, month+1, 0, 23,59,59);
      const q2 = query(
        collection(db, "monthly_skills_signoffs"),
        where("probationerEmail", "==", probEmail.trim()),
        where("createdAt", ">=", start),
        where("createdAt", "<=", end),
        orderBy("createdAt", "desc")
      );
      const snap2 = await getDocs(q2);
      setRecent(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid grid-2">
      {/* Left controls */}
      <div className="card pad">
        <h1 style={{marginTop:0}}>Monthly Skills Checkoff</h1>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8}}>
          <div>
            <label style={{fontSize:13, color:"var(--muted)"}}>Month</label>
            <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="input" style={{width:"100%"}}>
              {MONTHS.map((m,i)=>(<option key={m} value={i}>{m}</option>))}
            </select>
          </div>
          <div>
            <label style={{fontSize:13, color:"var(--muted)"}}>Year</label>
            <input className="input" type="number" value={year} onChange={e=>setYear(Number(e.target.value))} />
          </div>
        </div>

        <div style={{marginTop:10}}>
          <label style={{fontSize:13, color:"var(--muted)"}}>Probationer Email</label>
          <input
            className="input"
            placeholder="probationer@dept.org"
            value={probEmail}
            onChange={e=>setProbEmail(e.target.value)}
            style={{width:"100%"}}
          />
        </div>

        <div style={{marginTop:10}}>
          <label style={{fontSize:13, color:"var(--muted)"}}>Notes (optional)</label>
          <textarea className="input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} style={{width:"100%"}} />
        </div>

        <div className="card pad" style={{marginTop:12}}>
          <strong>Recent entries</strong>
          <ul style={{listStyle:"none", padding:0, margin:"8px 0 0", maxHeight:220, overflow:"auto"}}>
            {recent.map(r=>(
              <li key={r.id} style={{padding:"6px 0", borderBottom:"1px solid var(--border)"}}>
                <span className={r.result==="pass" ? "badge badge-ok" : "badge badge-bad"}>{r.result}</span>{" "}
                <code style={{background:"#f3f4f6", padding:"2px 6px", borderRadius:6}}>{r.skillId}</code>{" "}
                • {r.notes || "—"}
              </li>
            ))}
            {!recent.length && <li style={{color:"var(--muted)"}}>No entries for this month.</li>}
          </ul>
        </div>
      </div>

      {/* Right skills list */}
      <div className="card pad">
        <h2 style={{marginTop:0}}>Skills for {MONTHS[month]} {year}</h2>
        <div className="table-wrap" style={{marginTop:8}}>
          <table>
            <thead>
              <tr>
                <th>Skill</th>
                <th>Details</th>
                <th style={{width:200, textAlign:"right"}}>Record</th>
              </tr>
            </thead>
            <tbody>
              {SKILLS.map(s => (
                <tr key={s.id}>
                  <td style={{fontWeight:700}}>{s.title}</td>
                  <td style={{color:"var(--muted)"}}>{s.details}</td>
                  <td style={{textAlign:"right"}}>
                    <button
                      className="btn"
                      style={{background:"var(--brand)", color:"#fff", marginRight:6}}
                      disabled={!!busyId}
                      onClick={()=>record(s.id, "pass")}
                    >
                      {busyId===`${s.id}-pass` ? "Saving…" : "Pass"}
                    </button>
                    <button
                      className="btn"
                      style={{border:"1px solid var(--border)"}}
                      disabled={!!busyId}
                      onClick={()=>record(s.id, "fail")}
                    >
                      {busyId===`${s.id}-fail` ? "Saving…" : "Fail"}
                    </button>
                  </td>
                </tr>
              ))}
              {!SKILLS.length && (
                <tr><td colSpan={3} style={{padding:16, color:"var(--muted)"}}>No skills configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{color:"var(--muted)", fontSize:13, marginTop:8}}>
          Tip: we can load this list from Firestore later (e.g., <code>config/monthly_skills</code>) so you can edit it in Admin Editor.
        </div>
      </div>
    </div>
  );
}
