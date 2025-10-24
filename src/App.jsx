import { useEffect, useState, useRef } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { auth, googleLogin, logout } from "./lib/firebase";

// PAGES
import DriverCheckoffs from "./pages/DriverCheckoffs.jsx";
import DepartmentInfo from "./pages/DepartmentInfo.jsx";
import AdminInfo from "./pages/AdminInfo.jsx";
import Classroom from "./pages/Classroom.jsx";
import Manuals from "./pages/Manuals.jsx";
import MonthlySkills from "./pages/MonthlySkills.jsx";
import AdminEditor from "./pages/AdminEditor.jsx";
import Exports from "./pages/Exports.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => auth.onAuthStateChanged(setUser), []);

  return (
    <div className="app">
      <Header user={user} />
      <main className="container main">
        {!user ? (
          <WelcomeSignedOut />
        ) : (
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/driver" element={<DriverCheckoffs user={user} />} />
            <Route path="/department" element={<DepartmentInfo />} />
            <Route path="/admin" element={<AdminInfo />} />
            <Route path="/classroom" element={<Classroom />} />
            <Route path="/manuals" element={<Manuals />} />
            <Route path="/monthly" element={<MonthlySkills user={user} />} />
            <Route path="/admin-editor" element={<AdminEditor />} />
            <Route path="/exports" element={<Exports />} />
          </Routes>
        )}
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- HEADER WITH MOBILE DROPDOWN ---------------- */
function Header({ user }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const loc = useLocation();

  // Close menu when route changes
  useEffect(() => setOpen(false), [loc.pathname]);

  // Click outside to close
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      const m = menuRef.current, b = btnRef.current;
      if (m && !m.contains(e.target) && b && !b.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  async function handleLogin() {
    try { await googleLogin(); }
    catch (e) { console.error(e); alert(`Login failed: ${e.code || ""} ${e.message || e}`); }
  }

  return (
    <header className="header">
      <div className="container header-inner header-wrap">
        {/* Brand */}
        <Link to="/" className="brand">
          <div className="brand-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style={{ color: "#fff" }}>
              <path d="M12 2s4 3 4 7a4 4 0 1 1-8 0c0-2 1-4 4-7Zm0 8c4 0 8 3 8 7a8 8 0 1 1-16 0c0-4 4-7 8-7Z" />
            </svg>
          </div>
          <div>
            <div className="brand-title">Probation Tracker</div>
            <div className="brand-sub">Firefighter Checkoffs & Progress</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="nav">
          <Tab to="/driver">Driver Check-Offs</Tab>
          <Tab to="/department">Department Info</Tab>
          <Tab to="/admin">Admin Info</Tab>
          <Tab to="/classroom">Classroom</Tab>
          <Tab to="/manuals">Manuals</Tab>
          <Tab to="/monthly">Monthly Skills</Tab>
          <Tab to="/admin-editor">Admin Editor</Tab>
          <Tab to="/exports">Exports</Tab>
        </nav>

        {/* Right side: auth + mobile toggle */}
        <div className="userbox">
          <div className="userid">{user ? (user.displayName || user.email) : "Not signed in"}</div>

          {/* Mobile menu button */}
          <button
            ref={btnRef}
            className="mobile-toggle"
            aria-label="Open menu"
            aria-haspopup="menu"
            aria-expanded={open ? "true" : "false"}
            aria-controls="mobile-menu"
            onClick={() => setOpen(o => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            Menu
          </button>

          {!user ? (
            <button className="btn btn-primary" onClick={handleLogin}>Sign in</button>
          ) : (
            <button className="btn btn-outline" onClick={logout}>Sign out</button>
          )}
        </div>

        {/* Mobile dropdown menu */}
        <div
          id="mobile-menu"
          ref={menuRef}
          className={`mobile-menu ${open ? "open" : ""}`}
          role="menu"
          aria-labelledby="mobile-menu-button"
        >
          <MenuLink to="/driver">Driver Check-Offs</MenuLink>
          <MenuLink to="/department">Department Info</MenuLink>
          <MenuLink to="/admin">Admin Info</MenuLink>
          <MenuLink to="/classroom">Classroom</MenuLink>
          <MenuLink to="/manuals">Manuals</MenuLink>
          <MenuLink to="/monthly">Monthly Skills</MenuLink>
          <MenuLink to="/admin-editor">Admin Editor</MenuLink>
          <MenuLink to="/exports">Exports</MenuLink>
        </div>
      </div>
    </header>
  );
}

function Tab({ to, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => "tab" + (isActive ? " active" : "")}>
      {children}
    </NavLink>
  );
}

function MenuLink({ to, children }) {
  return (
    <NavLink to={to} role="menuitem">
      {({ isActive }) => (
        <span
          style={{
            display: "block",
            padding: "10px 12px",
            borderRadius: 8,
            fontWeight: 800,
            background: isActive ? "#fff0f0" : "transparent",
          }}
        >
          {children}
        </span>
      )}
    </NavLink>
  );
}

/* ---------------- CONTENT & FOOTER ---------------- */
function Welcome() {
  return (
    <div className="grid">
      <div className="card pad">
        <h1>Welcome</h1>
        <p style={{ color: "var(--muted)" }}>
          Use the tabs above to access driver check-offs, department info, manuals, monthly skills, and more.
        </p>
      </div>
    </div>
  );
}

function WelcomeSignedOut() {
  return (
    <div className="card pad" style={{ textAlign: "center" }}>
      <h1>Welcome</h1>
      <p style={{ color: "var(--muted)" }}>Please sign in with Google (top-right) to access the app.</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        © {new Date().getFullYear()} Probation Tracker • Built for firefighter training
      </div>
    </footer>
  );
}
