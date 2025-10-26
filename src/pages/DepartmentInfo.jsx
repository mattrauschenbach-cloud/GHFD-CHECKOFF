import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Reads from Firestore document: config/department
 * Fields supported (all optional):
 * - mission: string
 * - phones: [{label, number}]
 * - doorCodes: [{location, code}]
 * - radioChannels: [{name, freq, notes}]
 * - chainOfCommand: [{role, name, contact}]
 * - history: string
 * - stationDuties: [string]
 * - typicalDay: string
 */

const TABS = [
  { id: "mission", label: "Mission Statement" },
  { id: "phones", label: "Phone Numbers" },
  { id: "doorCodes", label: "Door Codes" },
  { id: "radioChannels", label: "Radio Channels" },
  { id: "chainOfCommand", label: "Chain of Command" },
  { id: "history", label: "History of FD" },
  { id: "stationDuties", label: "Station Duties" },
  { id: "typicalDay", label: "Typical Day" },
];

export default function DepartmentInfo() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TABS[0].id);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "department"));
        if (!alive) return;
        setData(snap.exists() ? snap.data() : {});
      } catch (e) {
        console.error(e);
        setError("Could not load department info.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const content = useMemo(() => {
    if (loading) return <div className="small">Loading…</div>;
    if (error) return <div className="small" style={{color:"#b91c1c"}}>{error}</div>;

    switch (tab) {
      case "mission":       return <Mission value={data.mission} />;
      case "phones":        return <Phones items={arr(data.phones)} />;
      case "doorCodes":     return <DoorCodes items={arr(data.doorCodes)} />;
      case "radioChannels": return <RadioChannels items={arr(data.radioChannels)} />;
      case "chainOfCommand":return <Chain items={arr(data.chainOfCommand)} />;
      case "history":       return <History text={data.history} />;
      case "stationDuties": return <StationDuties items={arr(data.stationDuties)} />;
      case "typicalDay":    return <TypicalDay text={data.typicalDay} />;
      default:              return <div className="small">Select a section.</div>;
    }
  }, [tab, data, loading, error]);

  return (
    <div className="card pad">
      <h1 style={{marginTop:0}}>Department Information</h1>
      <div className="tabs" role="tablist" aria-label="Department sections">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id ? "true" : "false"}
            aria-controls={`panel-${t.id}`}
            className="tab-chip"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" className="section">
        {content}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function arr(v) { return Array.isArray(v) ? v : []; }

/* ---------- sections ---------- */

function Mission({ value }) {
  if (!value) return <Empty note="No mission statement set." />;
  return (
    <div>
      <p style={{fontSize:16, lineHeight:1.6}}>{value}</p>
    </div>
  );
}

function Phones({ items }) {
  if (!items.length) return <Empty note="No phone numbers listed." />;
  return (
    <ul className="list">
      {items.map((p, i) => (
        <li key={i} className="kv">
          <div className="k">{p.label || "Contact"}</div>
          <div><a href={`tel:${(p.number||"").replace(/[^0-9+]/g,"")}`}>{p.number || "—"}</a></div>
        </li>
      ))}
    </ul>
  );
}

function DoorCodes({ items }) {
  if (!items.length) return <Empty note="No door codes listed." />;
  return (
    <ul className="list">
      {items.map((d, i) => (
        <li key={i} className="kv">
          <div className="k">{d.location || "Location"}</div>
          <div className="codepill">{d.code || "—"}</div>
        </li>
      ))}
    </ul>
  );
}

function RadioChannels({ items }) {
  if (!items.length) return <Empty note="No radio channels listed." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Channel</th>
            <th>Frequency</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c,i)=>(
            <tr key={i}>
              <td style={{fontWeight:700}}>{c.name || "—"}</td>
              <td><span className="codepill">{c.freq || "—"}</span></td>
              <td style={{color:"var(--muted)"}}>{c.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Chain({ items }) {
  if (!items.length) return <Empty note="No chain of command listed." />;
  return (
    <ul className="list">
      {items.map((c,i)=>(
        <li key={i} className="kv">
          <div className="k">{c.role || "Role"}</div>
          <div style={{fontWeight:700}}>{c.name || "—"}</div>
          <div className="small" style={{marginLeft:"auto"}}>
            {c.contact ? <a href={mailtoMaybe(c.contact)}>{c.contact}</a> : " "}
          </div>
        </li>
      ))}
    </ul>
  );
}

function History({ text }) {
  if (!text) return <Empty note="No department history provided." />;
  return <ParaBlock text={text} />;
}

function StationDuties({ items }) {
  if (!items.length) return <Empty note="No station duties listed." />;
  return (
    <ol style={{margin:"0 0 0 18px"}}>
      {items.map((d,i)=>(<li key={i} style={{margin:"8px 0"}}>{d}</li>))}
    </ol>
  );
}

function TypicalDay({ text }) {
  if (!text) return <Empty note="No typical day outline provided." />;
  return <ParaBlock text={text} />;
}

/* ---------- small components ---------- */

function Empty({ note }) {
  return <div className="small">{note}</div>;
}

function ParaBlock({ text }) {
  // Allow simple line breaks — store multi-line text in Firestore
  return text.split(/\n{2,}/).map((p, i) => (
    <p key={i} style={{fontSize:16, lineHeight:1.6, margin:"0 0 12px"}}>{p}</p>
  ));
}

function mailtoMaybe(s) {
  return s && s.includes("@") ? `mailto:${s}` : s || "";
}
