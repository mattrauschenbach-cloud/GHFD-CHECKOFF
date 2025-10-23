import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { auth, googleLogin, logout } from "./lib/firebase";

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
            <Route path="/admin-editor" element={<AdminEditor />} />
            <Route path="/exports" element={<Exports />} />
          </Routes>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Header({ user }) {
  async function handleLogin() {
    try { await googleLogin(); }
    catch (e) { console.error(e); alert(`Login failed: ${e.code || ""} ${e.message || e}`); }
  }
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <div className="brand-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style={{color:"#fff"}}>
              <path d="M12 2s4 3 4 7a4 4 0 1 1-8 0c0-2 1-4 4-7Zm0 8c4 0 8 3 8 7a8 8 0 1 1-16 0c0-4 4-7 8-7Z"/>
            </svg>
          </div>
          <div>
            <div className="brand-title">Probation Tracker</div>
            <div className="brand-sub">Firefighter Checkoffs & Progress</div>
          </div>
        </Link>

        <nav className="nav">
          <Tab to="/driver">Driver Check-Offs</Tab>
          <Tab to="/department">Department Info</Tab>
          <Tab to="/admin">Admin Info</Tab>
          <Tab to="/classroom">Classroom</Tab>
          <Tab to="/admin-editor">Admin Editor</Tab>
          <Tab to="/exports">Exports</Tab>
        </nav>

        <div className="userbox">
          <div className="userid">{user ? (user.displayName || user.email) : "Not signed in"}</div>
          {!user ? (
            <button className="btn btn-primary" onClick={handleLogin}>Sign in with Google</button>
          ) : (
            <button className="btn btn-outline" onClick={logout}>Sign out</button>
          )}
        </div>
      </div>
    </header>
  );
}

function Tab({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => "tab" + (isActive ? " active" : "")}
    >
      {children}
    </NavLink>
  );
}

function Welcome() {
  return (
    <div className="grid">
      <div className="card pad">
        <h1 style={{margin:"0 0 6px"}}>Welcome</h1>
        <p style={{color:"var(--muted)"}}>
          Use the tabs above to access driver check-offs, department info, admin info, and your classroom.
        </p>
      </div>

      <div className="grid" style={{gridTemplateColumns:"repeat(4,minmax(0,1fr))"}}>
        <div className="card kpi"><div className="label">Month</div><div className="val">— / 24</div></div>
        <div className="card kpi"><div className="label">Progress</div><div className="val">—%</div></div>
        <div className="card kpi"><div className="label">Overdue</div><div className="val">0</div></div>
        <div className="card kpi"><div className="label">Pending</div><div className="val">0</div></div>
      </div>
    </div>
  );
}

function WelcomeSignedOut() {
  return (
    <div className="card pad" style={{textAlign:"center"}}>
      <h1 style={{margin:"0 0 6px"}}>Welcome</h1>
      <p style={{color:"var(--muted)"}}>Please sign in with Google (top-right) to access the app.</p>
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
