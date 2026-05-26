import { useEffect, useState } from "react";
import { getElections } from "../api/electionService";
import { getLiveResults, getResults } from "../api/voteService";
import { getRole } from "../utils/auth";

function groupResults(rows) {
  const groups = new Map();

  for (const row of rows || []) {
    const key = row.post_id;
    const current = groups.get(key) || {
      post_id: row.post_id,
      post_name: row.post_name || "Post",
      rows: [],
    };

    current.rows.push(row);
    groups.set(key, current);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      rows: [...group.rows].sort((a, b) => b.total_votes - a.total_votes),
    }))
    .sort((a, b) => a.post_name.localeCompare(b.post_name));
}

function findWinner(group, winners) {
  const winner = (winners || []).find((item) => item.post_id === group.post_id);

  if (winner) {
    return winner;
  }

  return group.rows[0]
    ? {
        winner_name: group.rows[0].candidate_name,
        is_nota: group.rows[0].is_nota,
      }
    : null;
}

export default function Results() {
  const role = getRole();
  const isAdmin = role === "admin";
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function canShowResults(election) {
    if (isAdmin) {
      return true;
    }

    if (!election?.result_visible || !election?.voting_end) {
      return false;
    }

    return new Date() >= new Date(election.voting_end);
  }

  useEffect(() => {
    let cancelled = false;

    getElections()
      .then((data) => {
        if (cancelled) {
          return;
        }

        const visibleElections = (data || []).filter(canShowResults);
        setElections(visibleElections);

        if (visibleElections[0]) {
          loadResults(String(visibleElections[0].id));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load elections");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  async function loadResults(id) {
    setElectionId(id);
    setError("");

    if (!id) {
      setResults(null);
      return;
    }

    setLoading(true);

    try {
      const data = isAdmin ? await getLiveResults(id) : await getResults(id);
      const rows = Array.isArray(data) ? data : data.results || [];

      setResults({
        mode: Array.isArray(data) ? "live" : data.mode || "final",
        rows,
        winners: Array.isArray(data) ? [] : data.winners || [],
      });
    } catch (err) {
      setResults(null);
      setError(err.response?.data?.detail || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  const selectedElection = elections.find((item) => String(item.id) === String(electionId));
  const groupedResults = groupResults(results?.rows || []);

  return (
    <div className="results-page">
      <section className="card results-hero">
        <div>
          <p className="results-kicker">{isAdmin ? "Admin View" : "Published Results"}</p>
          <h1>Results</h1>
          <p className="results-subtitle">
            {isAdmin
              ? "Inspect live standings by post, including vote counts and NOTA performance."
              : "View the final winners for each post without exposing vote totals."}
          </p>
        </div>

        {results && (
          <span className={`results-mode-pill ${results.mode === "live" ? "results-mode-pill-live" : ""}`}>
            {results.mode === "live" ? "Live Count" : "Final Result"}
          </span>
        )}
      </section>

      {error && <div className="error">{error}</div>}

      <section className="card results-shell">
        <div className="results-toolbar">
          <div className="results-select-wrap">
            <label htmlFor="results-election">Election</label>
            <select
              id="results-election"
              value={electionId}
              onChange={(e) => loadResults(e.target.value)}
            >
              <option value="">Select Election</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.title} - {election.year}
                </option>
              ))}
            </select>
          </div>

          {selectedElection && (
            <div className="results-election-meta">
              <span className="results-meta-label">Selected</span>
              <strong>
                {selectedElection.title} - {selectedElection.year}
              </strong>
            </div>
          )}
        </div>

        {!elections.length && (
          <div className="results-empty">
            <h3>No results available</h3>
            <p>
              {isAdmin
                ? "No elections were found yet."
                : "Results will appear here after an election is published."}
            </p>
          </div>
        )}

        {loading && (
          <div className="results-empty">
            <p>Loading results...</p>
          </div>
        )}

        {!loading && electionId && !groupedResults.length && (
          <div className="results-empty">
            <h3>No votes found</h3>
            <p>This election does not have result rows yet.</p>
          </div>
        )}

        {!loading && groupedResults.length > 0 && (
          <div className="results-board">
            {groupedResults.map((group) => {
              const winner = findWinner(group, results?.winners);

              return (
                <article className="results-post-card" key={group.post_id}>
                  <div className="results-post-head">
                    <div>
                      <p className="results-post-label">Post</p>
                      <h2>{group.post_name}</h2>
                    </div>

                    {winner && (
                      <div className={`results-winner-badge ${winner.is_nota ? "results-winner-badge-nota" : ""}`}>
                        <span>Winner</span>
                        <strong>{winner.winner_name}</strong>
                      </div>
                    )}
                  </div>

                  <div className="results-candidate-list">
                    {group.rows.map((row, index) => (
                      <div className="results-candidate-row" key={`${group.post_id}-${row.candidate_id ?? "nota"}-${index}`}>
                        <div className="results-candidate-main">
                          <span className="results-rank">#{index + 1}</span>
                          <div>
                            <strong>{row.candidate_name}</strong>
                            <p>{row.is_nota ? "None of the above" : "Candidate"}</p>
                          </div>
                        </div>

                        {isAdmin ? (
                          <div className="results-votes-box">
                            <span>Votes</span>
                            <strong>{row.total_votes}</strong>
                          </div>
                        ) : (
                          winner?.winner_name === row.candidate_name && (
                            <span className="badge">Declared Winner</span>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
