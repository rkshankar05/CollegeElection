import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Elections from "./features/elections/pages/Elections";
import Posts from "./pages/Posts";
import Apply from "./pages/Apply";
import MyApplications from "./pages/MyApplications";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPublish from "./pages/AdminPublish";
import { isLoggedIn, getRole } from "./utils/auth";

import Students from "./pages/Students";
import AdminApplications from "./pages/AdminApplications";
import Vote from "./features/voting/pages/Vote";
import Results from "./pages/Results";
import PublishedCandidates from "./pages/PublishedCandidates";
import Profile from "./pages/Profile";

function Home() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const role = getRole();

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/elections" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<Students />} />                <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-publish" element={<AdminPublish />} />
          <Route path="/elections" element={<Elections />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/applications" element={<MyApplications />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-applications" element={<AdminApplications />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/results" element={<Results />} />
        <Route path="/published-candidates" element={<PublishedCandidates />} />
        <Route path="/profile" element={<Profile />} />
  
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
