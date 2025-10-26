import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Tabs (ids must match keys inside department.pdfs)
const TABS = [
  { id: "mission",        label: "Mission Statement" },
  { id: "phones",         label: "Phone Numbers" },
  { id: "doorCodes",      label: "Door Codes" },
  { id: "radioChannels",  label: "Radio Channels" },
  { id: "chainOfCommand", label: "Chain of Command" },
  { id: "history",        label: "History of FD" },
  { id: "stationDuties",  label: "Station Duties" },
  { id: "typicalDay",     label: "Typical Day" }
];

export default function DepartmentInfo() {
  const [pdfs, setPdfs] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TABS[0].id);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "department"));
        if (!alive) return;
        const data = snap.exists() ? snap.data() : {};
        setPdfs(data.pdfs || {});
      } catch (e) {
        console.error(e);
        setError("Could not load department PDFs.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const src = useMemo(() => (pdfs && typeof pdfs === "object" ? pdfs[tab] : null), [pdfs, tab]);

  return (
    <div className="grid" style={{ gridTemplateColumns: "280px 1fr", gap: 16 }}>
      {/* Left: Tabs */}
      <div className="card pad">
        <h1 style={{ marginTop: 0 }}>Department Information</h1>
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

        {/* Quick actions */}
        <div className="small" style={{ marginTop: 8 }}>
          {loading ? "Loading…" : src ? "PDF found." : "No PDF set for this tab."}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <a
            className="btn"
            style={{ background: "var(--brand)", color: "#fff" }}
            href={src || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={e => { if (!src) e.preventDefault(); }}
          >
            Open
          </a>
          <a
            className="btn"
            style={{ border: "1px solid var(--border)" }}
            href={src || "#"}
            download
            onClick={e => { if (!src) e.preventDefault(); }}
          >
            Download
          </a>
        </div>

        {/* Optional: show the exact path for admins/troubleshooting */}
        {src && <div className="small" style={{ marginTop: 6, wordBreak: "break-all" }}>{src}</div>}
      </div>

      {/* Right: Embedded PDF viewer */}
      <div id={`panel-${tab}`} role="tabpanel" className="card pad" style={{ minHeight: "70vh" }}>
        {error ? (
          <div className="small" style={{ color: "#b91c1c" }}>{error}</div>
        ) : loading ? (
          <div className="small">Loading…</div>
        ) : !src ? (
          <div className="small">No PDF set for this tab. Add a URL in <code>config/department.pdfs.{tab}</code>.</div>
        ) : (
          <div style={{ height: "70vh", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <object data={src} type="application/pdf" width="100%" height="100%">
              <iframe title={`${tab}-pdf`} src={src} width="100%" height="100%"></iframe>
            </object>
          </div>
        )}
      </div>
    </div>
  );
}
