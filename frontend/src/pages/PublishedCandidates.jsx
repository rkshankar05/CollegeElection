import { useEffect, useState } from "react";
import { getElections, getPublishedCandidates } from "../api/electionService";

export default function PublishedCandidates() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [groups, setGroups] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    getElections()
      .then(setElections)
      .catch(() => setError("Failed to load elections"));
  }, []);

  async function loadCandidates(id) {
    setElectionId(id);
    setError("");

    if (!id) {
      setGroups({});
      return;
    }

    try {
      const data = await getPublishedCandidates(id);
      const list = Array.isArray(data) ? data : data.candidates || [];

      const grouped = list.reduce((acc, c) => {
        const post = c.post_name || "Other";

        if (!acc[post]) {
          acc[post] = [];
        }

        acc[post].push(c);
        return acc;
      }, {});

      setGroups(grouped);
    } catch (err) {
      setGroups({});
      setError(err.response?.data?.detail || "Failed to load candidates");
    }
  }

  return (
    <div>
      <h1>Published Candidates</h1>

      {error && <div className="error">{error}</div>}

      <div className="card">
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
          <div key={postName} className="post-section">
            <h2>{postName}</h2>

            <div className="candidate-grid">
              {groups[postName].map((c, index) => (
                <div className="candidate-card" key={index}>
                  <h3>{c.name || "Unknown Candidate"}</h3>
                  <p>{c.email || "Email not available"}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}