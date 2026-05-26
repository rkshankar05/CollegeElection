import { useEffect, useState } from "react";
import { getElections } from "../../../api/electionService";
import { getPublicCandidates } from "../../../api/candidateService";
import { submitVote } from "../services/voteService";

export default function Vote() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [groups, setGroups] = useState({});
  const [selected, setSelected] = useState({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getElections()
      .then(setElections)
      .catch(() => setError("Failed to load elections"));
  }, []);

  async function loadCandidates(id) {
    setElectionId(id);
    setSelected({});
    setError("");
    setMsg("");

    if (!id) {
      setGroups({});
      return;
    }

    try {
      const data = await getPublicCandidates(id);
      const list = Array.isArray(data) ? data : data.candidates || [];

      const grouped = list.reduce((acc, c) => {
        const postName = c.post_name || "Other";

        if (!acc[postName]) {
          acc[postName] = [];
        }

        acc[postName].push(c);
        return acc;
      }, {});

      setGroups(grouped);
    } catch (err) {
      setGroups({});
      setError(err.response?.data?.detail || "Failed to load candidates");
    }
  }

  async function submit(e) {
    e.preventDefault();

    if (!electionId) {
      setError("Please select election");
      return;
    }

    if (Object.keys(selected).length === 0) {
      setError("Please select at least one candidate");
      return;
    }

    try {
      await submitVote({
        election_id: Number(electionId),
        // Transform { postName: { post_id, candidate_id } } -> [{ post_id, candidate_id }]
        votes: Object.values(selected),
      });

      setMsg("Vote submitted successfully");
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Vote failed");
      setMsg("");
    }
  }

  return (
    <div>
      <h1>Vote</h1>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <form className="card form-shell" onSubmit={submit}>
        <div className="section-head">
          <h2>Select Election</h2>
          <p className="hint">Choose one approved candidate for each available post.</p>
        </div>

        <select
          value={electionId}
          onChange={(e) => loadCandidates(e.target.value)}
        >
          <option value="">Select Election</option>

          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} - {e.year}
            </option>
          ))}
        </select>

        {Object.keys(groups).map((postName) => (
          <div className="post-section" key={postName}>
            <div className="section-head">
              <h2>{postName}</h2>
              <span className="badge">{groups[postName].length} options</span>
            </div>

            <div className="candidate-grid">
              {groups[postName].map((c, index) => (
                <div
                  className={`candidate-card vote-card ${
                    selected[postName]?.candidate_id === c.candidate_id ? "selected" : ""
                  }`}
                  key={index}
                >
                  <div className="vote-card-copy">
                    <h3>{c.name || "Unknown Candidate"}</h3>
                    <p>{c.email || "Email not available"}</p>
                  </div>

                  <button
                    type="button"
                    className={`vote-select-btn ${
                      selected[postName]?.candidate_id === c.candidate_id ? "active" : ""
                    }`}
                    onClick={() =>
                      setSelected({
                        ...selected,
                        // Store both post_id and candidate_id so submit payload is correct
                        [postName]: { post_id: c.post_id, candidate_id: c.candidate_id },
                      })
                    }
                  >
                    {selected[postName]?.candidate_id === c.candidate_id ? "Selected" : "Select"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button className="submit-btn" type="submit">
          Submit Vote
        </button>
      </form>
    </div>
  );
}
