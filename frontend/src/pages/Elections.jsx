import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getElections } from "../api/electionService";

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getElections()
      .then(setElections)
      .catch(() => setError("Failed to load elections"));
  }, []);

  function getElectionStatus(election) {
    const now = new Date();

    const appStart = new Date(election.application_start);
    const appEnd = new Date(election.application_deadline);
    const voteStart = new Date(election.voting_start);
    const voteEnd = new Date(election.voting_end);

    if (now < appStart) {
      return `Application starts in ${formatRemaining(appStart - now)}`;
    }

    if (now >= appStart && now <= appEnd) {
      return "Application is open";
    }

    if (now > appEnd && now < voteStart) {
      return `Application closed. Voting starts in ${formatRemaining(voteStart - now)}`;
    }

    if (now >= voteStart && now <= voteEnd) {
      return "Voting is open";
    }

    return "Election closed";
  }

  function canApply(election) {
    const now = new Date();
    return (
      now >= new Date(election.application_start) &&
      now <= new Date(election.application_deadline)
    );
  }

  function canVote(election) {
    const now = new Date();
    return (
      now >= new Date(election.voting_start) &&
      now <= new Date(election.voting_end)
    );
  }

  function formatRemaining(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  return (
    <div>
      <h1>Elections</h1>

      {error && <div className="error">{error}</div>}

      {elections.map((election) => (
        <div className="card" key={election.id}>
          <h2>{election.title}</h2>

          <p>Year: {election.year}</p>
          <p>Status: {election.status}</p>
          <p className="hint">{getElectionStatus(election)}</p>

          <div className="action-row">
            {canApply(election) && (
              <Link className="btn-link" to="/apply">
                Apply Now
              </Link>
            )}

            {canVote(election) && (
              <Link className="btn-link" to="/vote">
                Vote Now
              </Link>
            )}

            <Link className="btn-secondary" to="/published-candidates">
              View Candidates
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}