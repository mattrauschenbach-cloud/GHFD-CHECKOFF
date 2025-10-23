import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { auth } from "./lib/firebase";

function Home() {
  return <div style={{padding:16}}>Welcome — sign in and you’re good.</div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => auth.onAuthStateChanged(setUser), []);
  return (
    <div style={{fontFamily:"system-ui,sans-serif"}}>
      <header style={{borderBottom:"1px solid #eee", padding:12}}>
        <Link to="/" style={{textDecoration:"none", fontWeight:700, color:"#111827"}}>Probation Tracker</Link>
        <nav style={{display:"inline-flex", gap:12, marginLeft:16}}>
          <NavLink to="/" style={{textDecoration:"none"}}>Home</NavLink>
        </nav>
        <span style={{float:"right", color:"#6b7280"}}>{user ? user.email : "Not signed in"}</span>
      </header>
      <main style={{maxWidth:960, margin:"16px auto", padding:"0 16px"}}>
        <Routes>
          <Route path="/" element={<Home/>} />
        </Routes>
      </main>
    </div>
  );
}
