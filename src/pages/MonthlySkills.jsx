import { useEffect, useMemo, useState } from "react";
import {
  addSkillToMonth,
  listMonthlySignoffs,
  loadMonthlyCatalog,
  recordMonthlySignoff,
  removeSkillFromMonth,
  updateSkillInMonth,
  moveSkillInMonth
} from "../lib/monthly";

const MONTHS = ["1","2","3","4","5","6"];
const LABEL = { "1":"Month 1","2":"Month 2","3":"Month 3","4":"Month 4","5":"Month 5","6":"Month 6" };

export default function MonthlySkills({ user }) {
  const [month, setMonth] = useState("1");
  const [catalog, setCatalog] = useState({ "1":[], "2":[], "3":[], "4":[], "5":[], "6":[] });
  const [probEmail, setProbEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState("");
  const [recent, setRecent] = useState([]);

  // ALWAYS show Manage; no owner check
  const [mode, setMode] = useState("manage"); // "manage" | "evaluate"

  useEffect(() => {
    (async () => setCatalog(await loadMonthlyCatalog()))();
  }, []);

  useEffect(() => {
    (async () => {
      if (!probEmail) { setRecent([]); return; }
      setRecent(await listMonthlySignoffs(probEmail, month));
    })();
  }, [probEmail, month]);

  const skills = useMemo(() => catalog[month] || [], [catalog, month]);

  async function doRecord(skillId, result) {
    if (!probEmail) { alert("Enter the probationer’s email."); return; }
    setBusy(`${skillId}-${result}`);
    try {
      await recordMonthlySignoff({
        probationerEmail: probEmail,
        month: Number(month),
        skillId,
        result,
        notes,
        evaluator: user
      });
      setNotes("");
      setRecent(await listMonthlySignoffs(probEmail, month));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid grid-2">
      {/* LEFT: Controls + Manage form (ALWAYS visible) */}
      <div className="card pad">
        <h1 style={{marginTop:0}}>Monthly Skills</h1>

        {/* Mode switch */}
        <div style={{display:"flex", gap:8, margin:"6px 0 12px"}}>
          <button className="tab-chip" aria-selected={mode==="manage"} onClick={()=>setMode("manage")}>Manage</button>
          <button className="tab-chip" aria-selected={mode==="evaluate"} onClick={()=>setMode("evaluate")}>Evaluate</button>
        </div>

        {/* Month chooser */}
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {MONTHS.map(m => (
            <button key={m} className="tab-chip" aria-selected={month===m} onClick={()=>setMonth(m)}>
              {LABEL[m]}
            </button>
          ))}
        </div>

        {mode === "evaluate" ? (
          <>
            <div style={{marginTop:12}}>
              <label style={{fontSize:13, color:"var(--muted)"}}>Probationer Email</label>
              <input
                className="input" style={{width:"100%"}}
                placeholder="probationer@dept.org"
                value={probEmail}
                onChange={e=>setProbEmail(e.target.value)}
              />
            </div>
            <div style={{marginTop:8}}>
              <label style={{fontSize:13, color:"var(--muted)"}}>Notes (optional)</label>
              <textarea className="input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} style={{width:"100%"}} />
            </div>
            <RecentList items={recent} />
          </>
        ) : (
          <Manager month={month} setCatalog={setCatalog} skills={skills} />
        )}
      </div>

      {/* RIGHT: Table */}
      <div className="card pad">
        {mode === "evaluate" ? (
          <>
            <h2 style={{marginTop:0}}>{LABEL[month]} — Evaluate</h2>
            <SkillsTable
              skills={skills}
              busy={busy}
              onPass={(id)=>doRecord(id,"pass")}
              onFail={(id)=>doRecord(id,"fail")}
            />
            {!skills.length && <div className="small" style={{marginTop:8}}>No skills configured for this month yet.</div>}
          </>
        ) : (
          <>
            <h2 style={{marginTop:0}}>{LABEL[month]} — Manage Skills</h2>
            <ManageTable
              month={month}
              skills={skills}
              setCatalog={setCatalog}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Evaluate ---------- */
function SkillsTable({ skills, busy, onPass, onFail }) {
  return (
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
          {skills.map(s => (
            <tr key={s.id}>
              <td style={{fontWeight:700}}>{s.title}</td>
              <td style={{color:"var(--muted)"}}>{s.details || "—"}</td>
              <td style={{textAlign:"right"}}>
                <button className="btn" style={{background:"var(--brand)", color:"#fff", marginRight:6}}
                        disabled={!!busy} onClick={()=>onPass(s.id)}>
                  {busy===`${s.id}-pass` ? "Saving…" : "Pass"}
                </button>
                <button className="btn" style={{border:"1px solid var(--border)"}}
                        disabled={!!busy} onClick={()=>onFail(s.id)}>
                  {busy===`${s.id}-fail` ? "Saving…" : "Fail"}
                </button>
              </td>
            </tr>
          ))}
          {!skills.length && <tr><td colSpan={3} style={{padding:16}}></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function RecentList({ items }) {
  return (
    <div className="card pad" style={{marginTop:12}}>
      <strong>Recent entries</strong>
      <ul style={{listStyle:"none", padding:0, margin:"8px 0 0", maxHeight:220, overflow:"auto"}}>
        {items.map(r=>(
          <li key={r.id} style={{padding:"6px 0", borderBottom:"1px solid var(--border)"}}>
            <span className={r.result==="pass" ? "badge badge-ok" : "badge badge-bad"}>{r.result}</span>{" "}
            <code className="codepill">{r.skillId}</code>{" "}
            • {r.notes || "—"}
          </li>
        ))}
        {!items.length && <li style={{color:"var(--muted)"}}>No entries for this month.</li>}
      </ul>
    </div>
  );
}

/* ---------- Manage (always visible now) ---------- */
function Manager({ month, setCatalog, skills }) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  async function addSkill() {
    const t = title.trim();
    const d = details.trim();
    if (!t) { alert("Enter a skill title."); return; }
    const id = makeId(t);
    await addSkillToMonth(month, { id, title: t, details: d });
    setCatalog(await loadMonthlyCatalog());
    setTitle(""); setDetails("");
  }

  return (
    <div className="card pad" style={{marginTop:12}}>
      <div style={{display:"grid", gridTemplateColumns:"1fr 2fr auto", gap:8}}>
        <input className="input" placeholder="Skill title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="input" placeholder="Details (optional)" value={details} onChange={e=>setDetails(e.target.value)} />
        <button className="btn" style={{background:"var(--brand)", color:"#fff"}} onClick={addSkill}>Add</button>
      </div>
      <div className="small" style={{marginTop:6}}>
        Click <strong>Add</strong> to create a skill under {LABEL[month]}. Use the table on the right to edit, reorder, or remove.
      </div>
    </div>
  );
}

function ManageTable({ month, skills, setCatalog }) {
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");

  function startEdit(s) {
    setEditId(s.id);
    setEditTitle(s.title || "");
    setEditDetails(s.details || "");
  }
  function cancel() {
    setEditId(null);
    setEditTitle("");
    setEditDetails("");
  }

  async function save() {
    await updateSkillInMonth(month, editId, { title: editTitle.trim(), details: editDetails.trim() });
    setCatalog(await loadMonthlyCatalog());
    cancel();
  }

  async function remove(id) {
    if (!confirm("Remove this skill from the month?")) return;
    await removeSkillFromMonth(month, id);
    setCatalog(await loadMonthlyCatalog());
  }

  async function move(id, delta) {
    await moveSkillInMonth(month, id, delta);
    setCatalog(await loadMonthlyCatalog());
  }

  return (
    <div className="table-wrap" style={{marginTop:8}}>
      <table>
        <thead>
          <tr>
            <th style={{width:44}}></th>
            <th>Skill</th>
            <th>Details</th>
            <th style={{width:220, textAlign:"right"}}></th>
          </tr>
        </thead>
        <tbody>
          {skills.map((s, i) => {
            const editing = editId === s.id;
            return (
              <tr key={s.id}>
                <td>
                  <div style={{display:"flex", gap:6}}>
                    <button className="btn" style={{border:"1px solid var(--border)"}} onClick={()=>move(s.id, -1)} disabled={i===0}>↑</button>
                    <button className="btn" style={{border:"1px solid var(--border)"}} onClick={()=>move(s.id, +1)} disabled={i===skills.length-1}>↓</button>
                  </div>
                </td>
                <td>
                  {editing ? (
                    <input className="input" value={editTitle} onChange={e=>setEditTitle(e.target.value)} />
                  ) : (
                    <strong>{s.title}</strong>
                  )}
                </td>
                <td>
                  {editing ? (
                    <input className="input" value={editDetails} onChange={e=>setEditDetails(e.target.value)} />
                  ) : (
                    <span style={{color:"var(--muted)"}}>{s.details || "—"}</span>
                  )}
                </td>
                <td style={{textAlign:"right"}}>
                  {!editing ? (
                    <>
                      <button className="btn" style={{border:"1px solid var(--border)", marginRight:6}} onClick={()=>startEdit(s)}>Edit</button>
                      <button className="btn" style={{border:"1px solid var(--border)"}} onClick={()=>remove(s.id)}>Remove</button>
                    </>
                  ) : (
                    <>
                      <button className="btn" style={{background:"var(--brand)", color:"#fff", marginRight:6}} onClick={save}>Save</button>
                      <button className="btn" style={{border:"1px solid var(--border)"}} onClick={cancel}>Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {!skills.length && (
            <tr><td colSpan={4} style={{padding:16, color:"var(--muted)"}}>No skills yet — add some on the left.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- utils ---------- */
function makeId(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}
