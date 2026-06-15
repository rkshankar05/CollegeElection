import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./Dashboard";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Elections from "../features/elections/pages/Elections";
import Apply from "../features/candidates/pages/Apply";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AdminPublish from "../features/admin/pages/AdminPublish";
import Students from "../features/admin/pages/Students";
import AdminApplications from "../features/admin/pages/AdminApplications";
import Vote from "../features/voting/pages/Vote";
import Results from "../pages/Results";
import { isLoggedIn, getRole } from "../utils/auth";

function Home() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return getRole() === "admin"
    ? <Navigate to="/admin" replace />
    : <Navigate to="/dashboard" replace />;
}

function RequireAuth({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireRole({ role, children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (getRole() !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/students" element={<RequireRole role="admin"><Students /></RequireRole>} />
      <Route path="/admin-publish" element={<RequireRole role="admin"><AdminPublish /></RequireRole>} />
      <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
      <Route path="/admin-applications" element={<RequireRole role="admin"><AdminApplications /></RequireRole>} />
      <Route path="/elections" element={<RequireRole role="student"><Elections /></RequireRole>} />
      <Route path="/apply" element={<RequireRole role="student"><Apply /></RequireRole>} />
      <Route path="/vote" element={<RequireRole role="student"><Vote /></RequireRole>} />
      <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
