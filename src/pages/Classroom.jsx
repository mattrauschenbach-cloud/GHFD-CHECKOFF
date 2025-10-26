// src/pages/Classroom.jsx
export default function Classroom() {
  // ⬇️ Replace this with your actual Google Classroom link
  const CLASSROOM_URL = "https://classroom.google.com/";

  return (
    <div className="card pad">
      <h1 style={{ marginTop: 0 }}>Classroom</h1>
      <p style={{ color: "var(--muted)" }}>
        Open your Google Classroom in a new tab.
      </p>

      <a
        className="btn"
        style={{ background: "var(--brand)", color: "#fff", fontSize: 16, padding: "12px 16px" }}
        href={CLASSROOM_URL}
        target="_blank"
        rel="noreferrer"
      >
        Open Google Classroom
      </a>

      <div className="small" style={{ marginTop: 12 }}>
        (To change the destination, edit <code>CLASSROOM_URL</code> in <code>src/pages/Classroom.jsx</code>.)
      </div>
    </div>
  );
}
