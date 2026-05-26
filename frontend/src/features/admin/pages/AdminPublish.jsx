import { useEffect, useState } from "react";
import { getElections } from "../../elections/services/electionService";
import {
  publishCandidates,
  publishResult,
  unpublishCandidates,
  unpublishResult,
} from "../services/adminService";
import "../../../styles/admin.css";

export default function AdminPublish() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [selectedElection, setSelectedElection] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  function hasVotingEnded(election) {
    if (!election?.voting_end) {
      return false;
    }

    return new Date() >= new Date(election.voting_end);
  }

  function isResultPublished(election) {
    return Boolean(election?.result_visible) && hasVotingEnded(election);
  }

  useEffect(() => {
    getElections().then((data) => {
      const list = data || [];
      setElections(list);

      const now = new Date();
      const activeElection =
        list.find((election) => {
          const appStart = new Date(election.application_start);
          const voteEnd = new Date(election.voting_end);
          return now >= appStart && now <= voteEnd;
        }) || list[0];

      if (activeElection) {
        setElectionId(String(activeElection.id));
        setSelectedElection(activeElection);
      }
    });
  }, []);

  function handleElectionChange(id) {
    setElectionId(id);
    setMsg("");
    setError("");

    const election = elections.find((e) => String(e.id) === String(id));
    setSelectedElection(election || null);
  }

  async function run(action, successMsg) {
    if (!electionId) {
      setError("Please select election first");
      return;
    }

    try {
      await action(electionId);
      setMsg(successMsg);
      setError("");

      setSelectedElection((prev) => {
        if (!prev) return prev;

        if (action === publishCandidates) {
          return { ...prev, candidates_visible: true };
        }

        if (action === unpublishCandidates) {
          return { ...prev, candidates_visible: false };
        }

        if (action === publishResult) {
          return { ...prev, result_visible: true };
        }

        if (action === unpublishResult) {
          return { ...prev, result_visible: false };
        }

        return prev;
      });

      setElections((prev) =>
        prev.map((item) => {
          if (String(item.id) !== String(electionId)) {
            return item;
          }

          if (action === publishCandidates) {
            return { ...item, candidates_visible: true };
          }

          if (action === unpublishCandidates) {
            return { ...item, candidates_visible: false };
          }

          if (action === publishResult) {
            return { ...item, result_visible: true };
          }

          if (action === unpublishResult) {
            return { ...item, result_visible: false };
          }

          return item;
        })
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Action failed");
      setMsg("");
    }
  }

  return (
    <div>
      <h1>Publish Election</h1>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <div className="card">
        {selectedElection && (
          <div className="dashboard-note-band">
            <strong>Active Election</strong>
            <span>{selectedElection.title} - {selectedElection.year}</span>
          </div>
        )}

        <label>Select Election</label>

        <select
          value={electionId}
          onChange={(e) => handleElectionChange(e.target.value)}
        >
          <option value="">Choose election</option>

          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} - {e.year}
            </option>
          ))}
        </select>

        {selectedElection && (
          <div className="publish-actions">
            <div className="publish-box">
              <h3>Candidate List</h3>

              <p>
                Status:{" "}
                {selectedElection.candidates_visible
                  ? "Published"
                  : "Not Published"}
              </p>

              {selectedElection.candidates_visible ? (
                <button
                  className="danger"
                  onClick={() =>
                    run(unpublishCandidates, "Candidate list unpublished")
                  }
                >
                  Unpublish Candidate List
                </button>
              ) : (
                <button
                  onClick={() =>
                    run(publishCandidates, "Candidate list published")
                  }
                >
                  Publish Candidate List
                </button>
              )}
            </div>

            <div className="publish-box">
              <h3>Result</h3>

              <p>
                Status:{" "}
                {isResultPublished(selectedElection)
                  ? "Published"
                  : "Not Published"}
              </p>

              {isResultPublished(selectedElection) ? (
                <button
                  className="danger"
                  onClick={() => run(unpublishResult, "Result unpublished")}
                >
                  Unpublish Result
                </button>
              ) : !hasVotingEnded(selectedElection) ? (
                <button disabled>Publish Result After Voting Ends</button>
              ) : (
                <button onClick={() => run(publishResult, "Result published")}>
                  Publish Result
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
