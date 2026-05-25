import { useEffect, useState } from "react";
import { getElections } from "../api/electionService";
import { getResults } from "../api/voteService";

export default function Results() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getElections().then(setElections).catch(() => setError("Failed to load"));
  }, []);

  async function loadResults(id) {
    setElectionId(id);
    if (!id) return;

    try {
      const data = await getResults(id);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load results");
    }
  }

  return (
    <div>
      <h1>Results</h1>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <select value={electionId} onChange={(e) => loadResults(e.target.value)}>
          <option value="">Select Election</option>
          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} - {e.year}
            </option>
          ))}
        </select>

        <pre>{results ? JSON.stringify(results, null, 2) : "No result loaded"}</pre>
      </div>
    </div>
  );
}