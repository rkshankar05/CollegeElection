import { Routes, Route, Navigate } from "react-router-dom";

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

  const role = getRole();

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/elections" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/students" element={<Students />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-publish" element={<AdminPublish />} />
      <Route path="/elections" element={<Elections />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin-applications" element={<AdminApplications />} />
      <Route path="/vote" element={<Vote />} />
      <Route path="/results" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
