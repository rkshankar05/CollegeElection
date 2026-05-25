import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getElections } from "../api/electionService";
import { getRole, isLoggedIn, logout } from "../utils/auth";

export default function Navbar() {
  const role = getRole();
  const [showVoteLink, setShowVoteLink] = useState(false);
  const [showResultsLink, setShowResultsLink] = useState(false);

  useEffect(() => {
    if (role !== "student" || !isLoggedIn()) {
      setShowVoteLink(false);
      setShowResultsLink(false);
      return;
    }

    let cancelled = false;

    getElections()
      .then((elections) => {
        if (cancelled) {
          return;
        }

        const now = new Date();
        const hasActiveVoting = (elections || []).some((election) => {
          const votingStart = new Date(election.voting_start);
          const votingEnd = new Date(election.voting_end);

          return now >= votingStart && now <= votingEnd;
        });
        const hasPublishedResults = (elections || []).some(
          (election) =>
            election.result_visible &&
            now > new Date(election.voting_end)
        );

        setShowVoteLink(hasActiveVoting);
        setShowResultsLink(hasPublishedResults);
      })
      .catch(() => {
        if (!cancelled) {
          setShowVoteLink(false);
          setShowResultsLink(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

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
            <Link to="/elections">Elections</Link>
            <Link to="/published-candidates">Candidates</Link>
            <Link to="/apply">Apply</Link>
            {showVoteLink && <Link to="/vote">Vote</Link>}
            {showResultsLink && <Link to="/results">Results</Link>}
            <Link to="/applications">My Applications</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/students">Students</Link>
            <Link to="/admin-applications">Applications</Link>
            <Link to="/admin-publish">Publish</Link>
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
