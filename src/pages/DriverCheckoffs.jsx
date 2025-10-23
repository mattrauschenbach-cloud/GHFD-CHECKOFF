import { useEffect, useMemo, useState } from "react";
import { getDriverTasks, recordDriverSignoff, searchUsersByShift, getDriverSignoffs } from "../lib/driver";

export default function DriverCheckoffs({ user }) {
  const [tasks, setTasks] = useState([]);
  const [shift, setShift] = useState("");
  const [people, setPeople] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [signoffs, setSignoffs] = useState([]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("pass");
  const [notes, setNotes] = useState("");

  useEffect(() => { (async () => setTasks(await getDriverTasks()))(); }, []);
  useEffect(() => { (async () => setPeople(await searchUsersByShift(shift || null)))(); }, [shift]);
  useEffect(() => { (async () => {
    if (!selectedUser) return setSignoffs([]);
    setSignoffs(await getDriverSignoffs(selectedUser.id));
  })(); }, [selectedUser]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return !f ? tasks : tasks.filter(t => (t.id + t.title).toLowerCase().includes(f));
  }, [tasks, filter]);

  const latestStatus = (taskId) => {
    const s = signoffs.find(s => s.taskId === taskId);
    return s?.result || null;
  };

  async function handleSignoff(taskId) {
    if (!selectedUser) { alert("Pick a probationer first."); return; }
    setBusy(true);
    try {
      await recordDriverSignoff({
        userId: selectedUser.id,
        taskId,
        result,
        notes,
        evaluatorId: user.uid
      });
      setNotes("");
      setSignoffs(await getDriverSignoffs(selectedUser.id));
    } finally { setBusy(false); }
  }

  return (
    <div className="grid grid-2">
      {/* Left: People */}
      <div className="card pad">
        <h2 style={{marginTop:0}}>Select Probationer</h2>
        <div style={{display:"flex", gap:8, marginBottom:8}}>
          <label style={{alignSelf:"center", fontSize:13, color:"var(--muted)"}}>Shift</label>
          <select value={shift} onChange={e=>setShift(e.target.value)}>
            <option value="">All</option>
            <option value="A">Shift A</option>
            <option value="B">Shift B</option>
            <option value="C">Shift C</option>
          </select>
        </div>
        <ul style={{listStyle:"none", padding:0, margin:0, maxHeight:260, overflow:"auto"}}>
          {people.map(p => (
            <li key={p.id}
                onClick={()=>setSelectedUser(p)}
                style={{
                  padding:"8px 10px", borderBottom:"1px solid var(--border)", cursor:"pointer",
                  background: selectedUser?.id===p.id ? "#fff2f2" : "transparent",
                  borderRadius:8
                }}>
              <div style={{fontWeight:700}}>{p.displayName || p.email}</div>
              <div style={{fontSize:12, color:"var(--muted)"}}>Shift {p.shift || "-"}</div>
            </li>
          ))}
          {!people.length && <li style={{color:"var(--muted)"}}>No users found.</li>}
        </ul>
      </div>

      {/* Right: Record */}
      <div className="card pad">
        <h2 style={{marginTop:0}}>Record Check-Off</h2>
        <div style={{display:"flex", gap:8, marginBottom:8}}>
          <select value={result} onChange={e=>setResult(e.target.value)}>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <input className="input" placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} style={{flex:1}}/>
        </div>
        <input className="input" placeholder="Search tasks…" value={filter} onChange={e=>setFilter(e.target.value)} style={{width:"100%", marginBottom:8}}/>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Category</th>
                <th>Latest</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{fontWeight:700}}>{t.title}</div>
                    <div style={{fontSize:12, color:"var(--muted)"}}>{t.details}</div>
                  </td>
                  <td>{t.category}</td>
                  <td>
                    <StatusBadge value={latestStatus(t.id)} />
                  </td>
                  <td style={{textAlign:"right"}}>
                    <button disabled={busy || !selectedUser} onClick={()=>handleSignoff(t.id)} className="btn" style={{background:"var(--brand)", color:"#fff"}}>
                      {busy ? "Saving…" : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={4} style={{padding:16, color:"var(--muted)"}}>No tasks match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent */}
      {selectedUser && (
        <div className="card pad" style={{gridColumn:"1 / -1"}}>
          <h3 style={{marginTop:0}}>Recent Entries — {selectedUser.displayName || selectedUser.email}</h3>
          <ul style={{listStyle:"none", padding:0, margin:0}}>
            {signoffs.slice(0,10).map(s=>(
              <li key={s.id} style={{padding:"6px 0", borderBottom:"1px solid var(--border)"}}>
                <StatusBadge value={s.result}/> <code style={{background:"#f3f4f6", padding:"2px 6px", borderRadius:6}}>{s.taskId}</code> • {s.notes || "—"}
              </li>
            ))}
            {!signoffs.length && <li style={{color:"var(--muted)"}}>None yet.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ value }) {
  const v = value || "—";
  const cls = v === "pass" ? "badge badge-ok" : v === "fail" ? "badge badge-bad" : "badge badge-na";
  return <span className={cls}>{v}</span>;
}
