import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../features/auth/services/authService";
import { getElections } from "../features/elections/services/electionService";
import { getRole } from "../utils/auth";

const adminActions = [
  ["Dashboard", "Create elections, upload students, and create posts.", "/admin"],
  ["Students", "Manage official student records.", "/students"],
  ["Applications", "Review and approve candidate applications.", "/admin-applications"],
  ["Operations", "Move election state and publish candidates or results.", "/admin-publish"],
  ["Results", "Inspect live and final election results.", "/results"],
];

const studentActions = [
  ["Elections", "Check current backend election status.", "/elections"],
  ["Apply", "Apply for posts when applications are open.", "/apply"],
  ["Vote", "Vote during voting state and receive a receipt.", "/vote"],
  ["Results", "View published election results.", "/results"],
];

export default function Dashboard() {
  const role = getRole();
  const [user, setUser] = useState(null);
  const [elections, setElections] = useState([]);

  useEffect(() => {
    if (!role) {
      return;
    }

    if (role === "student") {
      getMe().then(setUser).catch(() => setUser(null));
    }

    getElections().then((data) => setElections(data || [])).catch(() => setElections([]));
  }, [role]);

  const hasPublishedResult = useMemo(
    () =>
      elections.some(
        (election) =>
          election.status === "RESULT_PUBLISHED" ||
          election.status === "ARCHIVED" ||
          election.result_visible
      ),
    [elections]
  );
  const hasActiveElection = useMemo(
    () =>
      elections.some((election) =>
        ["DRAFT", "APPLICATION_OPEN", "APPLICATION_CLOSED", "VOTING_OPEN", "VOTING_CLOSED"].includes(
          election.status
        )
      ),
    [elections]
  );

  const actions =
    role === "admin"
      ? adminActions.filter(([title]) => !hasPublishedResult || title !== "Applications")
      : hasPublishedResult && !hasActiveElection
        ? [["Results", "Election is complete. View the published result.", "/results"]]
        : studentActions;

  return (
    <div>
      <div className="section-head dashboard-title">
        <div>
          <h1>{role === "admin" ? "Admin Dashboard" : "Student Dashboard"}</h1>
          <p className="hint">
            {role === "admin"
              ? "Only admin tools are shown here."
              : "Only student election actions are shown here."}
          </p>
        </div>
        <span className="badge">{role || "student"}</span>
      </div>

      {role === "student" && (
        <section className="card student-details-card">
          <div>
            <span className="badge">Student</span>
            <h2>{user?.name || "Student"}</h2>
            <p>{user?.email || "Email not available"}</p>
          </div>
          {hasPublishedResult && !hasActiveElection && (
            <div className="student-result-note">
              Election completed. Only published results are shown now.
            </div>
          )}
        </section>
      )}

      <div className="dashboard-action-grid">
        {actions.map(([title, description, to]) => (
          <Link className="dashboard-action-card" to={to} key={to}>
            <h2>{title}</h2>
            <p>{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
