import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { auth, googleLogin, logout } from "./lib/firebase";

// Pages
import DriverCheckoffs from "./pages/DriverCheckoffs.jsx";
import DepartmentInfo from "./pages/DepartmentInfo.jsx";
import AdminInfo from "./pages/AdminInfo.jsx";
import Classroom from "./pages/Classroom.jsx";
import AdminEditor from "./pages/AdminEditor.jsx";
import Exports from "./pages/Exports.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => auth.onAuthStateChanged(setUser), []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <Header user={user} />
      <div style={{ maxWidth: 1100, margin: "20px auto", padding: "0 16px" }}>
        {!user ? (
          <WelcomeSignedOut />
        ) : (
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/driver" element={<DriverCheckoffs user={user} />} />
            <Route path="/department" element={<DepartmentInfo />} />
            <Route path="/admin" element={<AdminInfo />} />
            <Route path="/classroom" element={<Classroom />} />
            <Route path="/admin-editor" element={<AdminEditor />} />
            <Route path="/exports" element={<Exports />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

function Header({ user }) {
  async function handleLogin() {
    try {
      await googleLogin(); // uses popup; switch to redirect in firebase.js if needed
    } catch (e) {
      console.error(e);
      alert(`Login failed: ${e.code || ""} ${e.message || e}`);
    }
  }

  return (
    <div style={{ borderBottom: "1px solid #eee", background: "#fff" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          to="/"
          style={{ fontWeight: 700, textDecoration: "none", color: "#111827" }}
        >
          Probation Tracker
        </Link>

        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Tab to="/driver" label="Driver Check-Offs" />
          <Tab to="/department" label="Department Info" />
          <Tab to="/admin" label="Admin Info" />
          <Tab to="/classroom" label="Classroom" />
          <Tab to="/admin-editor" label="Admin Editor" />
          <Tab to="/exports" label="Exports" />
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#6b7280", minWidth: 160, textAlign: "right" }}>
            {user ? user.displayName || user.email : "Not signed in"}
          </div>
          {!user ? (
            <button onClick={handleLogin}>Sign in with Google</button>
          ) : (
            <button onClick={logout}>Sign out</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Tab({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: "none",
        padding: "6px 10px",
        borderRadius: 8,
        color: isActive ? "#111827" : "#374151",
        background: isActive ? "#f3f4f6" : "transparent",
      })}
    >
      {label}
    </NavLink>
  );
}

function Welcome() {
  return (
    <div style={{ padding: "12px 0" }}>
      <h1 style={{ margin: "8px 0 4px" }}>Welcome</h1>
      <p style={{ color: "#6b7280" }}>
        Use the tabs above to access driver check-offs, department info, admin info, and your classroom.
      </p>
    </div>
  );
}

function WelcomeSignedOut() {
  return (
    <div style={{ padding: "12px 0" }}>
      <h1 style={{ margin: "8px 0 4px" }}>Welcome</h1>
      <p style={{ color: "#6b7280" }}>
        Please sign in with Google (top-right) to access the app.
      </p>
    </div>
  );
}
