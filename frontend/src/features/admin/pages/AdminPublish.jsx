import { useEffect, useMemo, useState } from "react";
import { getElections } from "../../elections/services/electionService";
import {
  publishCandidates,
  publishResult,
  transitionElectionState,
} from "../services/adminService";
import "../../../styles/admin.css";

const nextState = {
  DRAFT: "APPLICATION_OPEN",
  APPLICATION_OPEN: "APPLICATION_CLOSED",
  APPLICATION_CLOSED: "VOTING_OPEN",
  VOTING_OPEN: "VOTING_CLOSED",
  VOTING_CLOSED: "RESULT_PUBLISHED",
  RESULT_PUBLISHED: "ARCHIVED",
};

const labels = {
  DRAFT: "Draft",
  APPLICATION_OPEN: "Open Applications",
  APPLICATION_CLOSED: "Close Applications",
  VOTING_OPEN: "Open Voting",
  VOTING_CLOSED: "Close Voting",
  RESULT_PUBLISHED: "Publish Result",
  ARCHIVED: "Archive",
};

export default function AdminPublish() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadElections();
  }, []);

  const selectedElection = useMemo(
    () => elections.find((item) => String(item.id) === String(electionId)) || null,
    [elections, electionId]
  );

  async function loadElections() {
    try {
      const data = await getElections();
      const list = data || [];
      setElections(list);
      if (!electionId && list[0]) {
        setElectionId(String(list[0].id));
      }
    } catch {
      setError("Failed to load elections");
    }
  }

  async function run(action, successMsg) {
    if (!selectedElection) {
      setError("Please select an election");
      return;
    }

    try {
      await action(selectedElection.id);
      setMsg(successMsg);
      setError("");
      await loadElections();
    } catch (err) {
      setError(err.response?.data?.detail || "Action failed");
      setMsg("");
    }
  }

  const next = selectedElection ? nextState[selectedElection.status] : "";

  return (
    <div>
      <h1>Election Operations</h1>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <section className="card">
        <label>Select Election</label>
        <select value={electionId} onChange={(e) => setElectionId(e.target.value)}>
          <option value="">Choose election</option>
          {elections.map((election) => (
            <option key={election.id} value={election.id}>
              {election.title} - {election.year}
            </option>
          ))}
        </select>

        {selectedElection && (
          <div className="publish-actions">
            <div className="publish-box">
              <h3>State</h3>
              <p>Status: {labels[selectedElection.status] || selectedElection.status}</p>
              {next ? (
                <button
                  onClick={() =>
                    run(
                      (id) => transitionElectionState(id, next),
                      `Election moved to ${labels[next] || next}`
                    )
                  }
                >
                  Move To {labels[next] || next}
                </button>
              ) : (
                <button disabled>No Next State</button>
              )}
            </div>

            <div className="publish-box">
              <h3>Candidate List</h3>
              <p>Status: {selectedElection.candidates_visible ? "Published" : "Hidden"}</p>
              <button
                disabled={selectedElection.candidates_visible}
                onClick={() => run(publishCandidates, "Candidate list published")}
              >
                Publish Candidates
              </button>
            </div>

            <div className="publish-box">
              <h3>Results</h3>
              <p>Status: {selectedElection.result_visible ? "Published" : "Hidden"}</p>
              <button
                disabled={selectedElection.status !== "VOTING_CLOSED"}
                onClick={() => run(publishResult, "Result published")}
              >
                Publish Result
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
