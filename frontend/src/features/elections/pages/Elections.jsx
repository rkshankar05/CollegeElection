import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getElections } from "../services/electionService";
import "../../../styles/elections.css";

const statusLabels = {
  DRAFT: "Draft",
  APPLICATION_OPEN: "Applications Open",
  APPLICATION_CLOSED: "Applications Closed",
  VOTING_OPEN: "Voting Open",
  VOTING_CLOSED: "Voting Closed",
  RESULT_PUBLISHED: "Result Published",
  ARCHIVED: "Archived",
};

const activeStatuses = new Set([
  "DRAFT",
  "APPLICATION_OPEN",
  "APPLICATION_CLOSED",
  "VOTING_OPEN",
  "VOTING_CLOSED",
]);

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getElections()
      .then((data) => setElections(data || []))
      .catch(() => setError("Failed to load elections"));
  }, []);

  function formatDate(value) {
    return value ? new Date(value).toLocaleString() : "N/A";
  }

  return (
    <div className="elections-page">
      <h1>Elections</h1>

      {error && <div className="error">{error}</div>}

      <div className="election-list">
        {elections.filter((election) => activeStatuses.has(election.status)).map((election) => (
          <article className="card election-showcase" key={election.id}>
            <div className="election-showcase-head">
              <div>
                <h2>{election.title}</h2>
                <p className="hint">Election {election.year}</p>
              </div>
              <span className="badge">{statusLabels[election.status] || election.status}</span>
            </div>

            <div className="election-metrics">
              <div className="election-metric">
                <span>Application Start</span>
                <strong>{formatDate(election.application_start)}</strong>
              </div>
              <div className="election-metric">
                <span>Application Deadline</span>
                <strong>{formatDate(election.application_deadline)}</strong>
              </div>
              <div className="election-metric">
                <span>Voting Start</span>
                <strong>{formatDate(election.voting_start)}</strong>
              </div>
              <div className="election-metric">
                <span>Voting End</span>
                <strong>{formatDate(election.voting_end)}</strong>
              </div>
            </div>

            <div className="action-row election-actions">
              {election.status === "APPLICATION_OPEN" && (
                <Link className="btn-link" to={`/apply?election=${election.id}`}>
                  Apply
                </Link>
              )}
              {election.status === "VOTING_OPEN" && (
                <Link className="btn-link" to="/vote">
                  Vote
                </Link>
              )}
              {election.status === "RESULT_PUBLISHED" && (
                <Link className="btn-secondary" to="/results">
                  Results
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
