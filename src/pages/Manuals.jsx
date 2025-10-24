import { useMemo, useState } from "react";

const MANUALS = [
  {
    id: "scott-x3-pro",
    title: "Scott Air-Pak X3 Pro / X3 Snap-Change – Operation & Maintenance",
    source: "/manuals/scott-air-pak-x3-pro-ops-maint-595279-01F.pdf",
    description:
      "Operating & Maintenance Instructions for SCOTT AIR-PAK X3 PRO & X3 Snap-Change (2.2 / 4.5 / 5.5), NFPA 1981 (2013).",
    tags: ["SCBA", "Scott", "Operations", "Maintenance", "NFPA 1981"],
  },
  // add more manuals here
];

export default function Manuals() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return MANUALS;
    return MANUALS.filter(m =>
      [m.title, m.description, ...(m.tags || [])].join(" ").toLowerCase().includes(needle)
    );
  }, [q]);

  const [openId, setOpenId] = useState(MANUALS[0]?.id || null);
  const open = filtered.find(m => m.id === openId) || filtered[0] || null;

  return (
    <div className="grid" style={{gridTemplateColumns:"320px 1fr", gap:16}}>
      {/* List */}
      <div className="card pad">
        <h1 style={{marginTop:0}}>Manuals</h1>
        <input
          className="input"
          placeholder="Search manuals…"
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={{width:"100%", margin:"8px 0 12px"}}
        />
        <ul style={{listStyle:"none", padding:0, margin:0, maxHeight:"60vh", overflow:"auto"}}>
          {filtered.map(m=>(
            <li key={m.id}
                onClick={()=>setOpenId(m.id)}
                style={{
                  padding:"10px 10px",
                  borderRadius:10,
                  border:"1px solid var(--border)",
                  marginBottom:10,
                  cursor:"pointer",
                  background: openId===m.id ? "#fff2f2" : "#fff"
                }}>
              <div style={{fontWeight:800}}>{m.title}</div>
              <div style={{fontSize:12, color:"var(--muted)", marginTop:4}}>{m.description}</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:6, marginTop:8}}>
                {(m.tags||[]).map(t=>(
                  <span key={t} className="badge badge-na">{t}</span>
                ))}
              </div>
            </li>
          ))}
          {!filtered.length && <li style={{color:"var(--muted)"}}>No matches.</li>}
        </ul>
      </div>

      {/* Viewer */}
      <div className="card pad" style={{minHeight:"70vh"}}>
        {!open ? (
          <div style={{color:"var(--muted)"}}>Select a manual from the list.</div>
        ) : (
          <>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
              <div>
                <h2 style={{margin:"0 0 6px"}}>{open.title}</h2>
                <div style={{fontSize:13, color:"var(--muted)"}}>{open.description}</div>
              </div>
              <div style={{display:"flex", gap:8}}>
                <a className="btn" style={{background:"var(--brand)", color:"#fff"}} href={open.source} target="_blank" rel="noreferrer">Open</a>
                <a className="btn" style={{border:"1px solid var(--border)"}} href={open.source} download>Download</a>
              </div>
            </div>

            <div style={{marginTop:12, height:"70vh", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden"}}>
              <object data={open.source} type="application/pdf" width="100%" height="100%">
                <iframe title="manual" src={open.source} width="100%" height="100%"></iframe>
              </object>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
