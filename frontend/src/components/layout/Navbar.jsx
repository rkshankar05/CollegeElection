import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getElections } from "../../features/elections/services/electionService";
import { getRole, isLoggedIn, logout } from "../../utils/auth";

export default function Navbar() {
  const role = getRole();
  const [elections, setElections] = useState([]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setElections([]);
      return;
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

  return (
    <nav className="navbar">
      <Link to="/" className="brand">College Election</Link>

      <div className="nav-links">
        {!isLoggedIn() && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}

        {role === "student" && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {(!hasPublishedResult || hasActiveElection) && (
              <>
                <Link to="/elections">Elections</Link>
                <Link to="/apply">Apply</Link>
                <Link to="/vote">Vote</Link>
              </>
            )}
            <Link to="/results">Results</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/students">Students</Link>
            <Link to="/admin-applications">Applications</Link>
            <Link to="/admin-publish">Operations</Link>
            <Link to="/results">Results</Link>
          </>
        )}

        {isLoggedIn() && (
          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
