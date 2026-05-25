import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getElections } from "../api/electionService";
import { getMyApplications } from "../api/candidateService";
import { getRole, isLoggedIn, logout } from "../utils/auth";

export default function Navbar() {
  const role = getRole();
  const [showVoteLink, setShowVoteLink] = useState(false);
  const [showResultsLink, setShowResultsLink] = useState(false);
  const [showApplyLink, setShowApplyLink] = useState(false);
  const [publishedCandidatesLink, setPublishedCandidatesLink] = useState("");

  useEffect(() => {
    if (role !== "student" || !isLoggedIn()) {
      setShowVoteLink(false);
      setShowResultsLink(false);
      setShowApplyLink(false);
      setPublishedCandidatesLink("");
      return;
    }

    let cancelled = false;

    Promise.all([getElections(), getMyApplications()])
      .then(([elections, applications]) => {
        if (cancelled) {
          return;
        }

        const now = new Date();
        const appliedElectionIds = new Set(
          (applications || []).map((app) => Number(app.election_id))
        );
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
        const publishedElection = (elections || []).find((election) => {
          const votingEnd = new Date(election.voting_end);
          return election.candidates_visible && now <= votingEnd;
        }) || (elections || []).find((election) => election.candidates_visible);
        const hasOpenApplicationWindow = (elections || []).some((election) => {
          const appStart = new Date(election.application_start);
          const appEnd = new Date(election.application_deadline);

          return now >= appStart && now <= appEnd;
        });
        const hasEligibleElectionToApply = (elections || []).some((election) => {
          const appStart = new Date(election.application_start);
          const appEnd = new Date(election.application_deadline);

          return (
            now >= appStart &&
            now <= appEnd &&
            !appliedElectionIds.has(Number(election.id))
          );
        });

        setShowVoteLink(hasActiveVoting);
        setShowResultsLink(hasPublishedResults);
        setShowApplyLink(hasOpenApplicationWindow && hasEligibleElectionToApply);
        setPublishedCandidatesLink(
          publishedElection
            ? `/published-candidates?election=${publishedElection.id}`
            : ""
        );
      })
      .catch(() => {
        if (!cancelled) {
          setShowVoteLink(false);
          setShowResultsLink(false);
          setShowApplyLink(false);
          setPublishedCandidatesLink("");
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
            {publishedCandidatesLink && <Link to={publishedCandidatesLink}>Candidates</Link>}
            {showApplyLink && <Link to="/apply">Apply</Link>}
            {showVoteLink && <Link to="/vote">Vote</Link>}
            {showResultsLink && <Link to="/results">Results</Link>}
            <Link to="/applications">My Applications</Link>
            <Link to="/profile">Profile</Link>
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
