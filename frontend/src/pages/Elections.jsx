import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getElections } from "../api/electionService";
import { getMyApplications } from "../api/candidateService";

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getElections(), getMyApplications()])
      .then(([electionData, applicationData]) => {
        setElections(electionData || []);
        setApplications(applicationData || []);
      })
      .catch(() => setError("Failed to load elections"));
  }, []);

  const appliedElectionIds = useMemo(
    () => new Set((applications || []).map((app) => Number(app.election_id))),
    [applications]
  );

  function getElectionPhase(election) {
    const now = new Date();
    const appStart = new Date(election.application_start);
    const appEnd = new Date(election.application_deadline);
    const voteStart = new Date(election.voting_start);
    const voteEnd = new Date(election.voting_end);

    if (now < appStart) {
      return {
        label: "Upcoming",
        summary: `Application starts in ${formatRemaining(appStart - now)}`,
        emphasis: {
          label: "Application Opens In",
          value: formatRemaining(appStart - now),
        },
      };
    }

    if (now >= appStart && now <= appEnd) {
      return {
        label: "Applications Open",
        summary: `Apply before ${formatDate(election.application_deadline)}`,
        emphasis: {
          label: "Deadline Countdown",
          value: formatRemaining(appEnd - now),
        },
      };
    }

    if (now > appEnd && now < voteStart) {
      return {
        label: "Application Closed",
        summary: `Voting starts in ${formatRemaining(voteStart - now)}`,
        emphasis: {
          label: "Voting Starts In",
          value: formatRemaining(voteStart - now),
        },
      };
    }

    if (now >= voteStart && now <= voteEnd) {
      return {
        label: "Voting Live",
        summary: `Voting ends on ${formatDate(election.voting_end)}`,
        emphasis: {
          label: "Voting Ends In",
          value: formatRemaining(voteEnd - now),
        },
      };
    }

    return {
      label: "Closed",
      summary: `Election closed on ${formatDate(election.voting_end)}`,
      emphasis: {
        label: "Election Closed",
        value: formatDay(election.voting_end),
      },
    };
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
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  function formatDate(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleString();
  }

  function formatDay(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleDateString();
  }

  function formatTime(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="elections-page">
      <section className="elections-hero card">
        <div>
          <p className="profile-eyebrow">Election Timeline</p>
          <h1>Active Election Windows</h1>
          <p className="hint">
            Track application deadlines, voting dates, and published candidate access from one place.
          </p>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <div className="election-list">
        {elections.map((election) => {
          const phase = getElectionPhase(election);
          const alreadyApplied = appliedElectionIds.has(Number(election.id));

          return (
            <article className="card election-showcase" key={election.id}>
              <div className="election-showcase-head">
                <div>
                  <p className="profile-kicker">Election {election.year}</p>
                  <h2>{election.title}</h2>
                </div>
                <span className="badge">{phase.label}</span>
              </div>

              <div className="election-highlight-band">
                <div>
                  <span className="election-highlight-label">{phase.emphasis.label}</span>
                  <strong className="election-highlight-value">{phase.emphasis.value}</strong>
                </div>
                <p className="election-summary">{phase.summary}</p>
              </div>

              <div className="election-metrics">
                <div className="election-metric">
                  <span>Application Deadline</span>
                  <strong>{formatDate(election.application_deadline)}</strong>
                </div>
                <div className="election-metric">
                  <span>Voting Date</span>
                  <strong>{formatDay(election.voting_start)}</strong>
                </div>
                <div className="election-metric">
                  <span>Voting Start Time</span>
                  <strong>{formatTime(election.voting_start)}</strong>
                </div>
                <div className="election-metric">
                  <span>Voting End Time</span>
                  <strong>{formatTime(election.voting_end)}</strong>
                </div>
              </div>

              <div className="election-footer">
                <div className="election-state-note">
                  {alreadyApplied ? (
                    <span className="badge">Already applied for this election</span>
                  ) : canApply(election) ? (
                    <span className="badge">Application window is open</span>
                  ) : canVote(election) ? (
                    <span className="badge">Voting is active</span>
                  ) : (
                    <span className="badge">Track updates from this page</span>
                  )}
                </div>

                <div className="action-row election-actions">
                  {canApply(election) && !alreadyApplied && (
                    <Link className="btn-link" to={`/apply?election=${election.id}`}>
                      Apply Now
                    </Link>
                  )}

                  {canVote(election) && (
                    <Link className="btn-link" to="/vote">
                      Vote Now
                    </Link>
                  )}

                  {election.candidates_visible && (
                    <Link className="btn-secondary" to={`/published-candidates?election=${election.id}`}>
                      View Candidates
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
