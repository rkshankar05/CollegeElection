import { useEffect, useState } from "react";
import { getElections } from "../api/electionService";
import {
  publishCandidates,
  publishResult,
  unpublishCandidates,
} from "../api/adminService";

export default function AdminPublish() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [selectedElection, setSelectedElection] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getElections().then(setElections);
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
          return { ...prev, candidates_published: true };
        }

        if (action === unpublishCandidates) {
          return { ...prev, candidates_published: false };
        }

        if (action === publishResult) {
          return { ...prev, result_published: true };
        }

        return prev;
      });
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
                {selectedElection.candidates_published
                  ? "Published"
                  : "Not Published"}
              </p>

              {selectedElection.candidates_published ? (
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
                {selectedElection.result_published
                  ? "Published"
                  : "Not Published"}
              </p>

              {selectedElection.result_published ? (
                <button disabled>Result Already Published</button>
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