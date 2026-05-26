import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getElections, getPublishedCandidates } from "../../elections/services/electionService";
import "../styles/candidates.css";

export default function PublishedCandidates() {
  const [searchParams] = useSearchParams();
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [groups, setGroups] = useState({});
  const [error, setError] = useState("");

  const publishedElections = useMemo(
    () => (elections || []).filter((election) => election.candidates_visible),
    [elections]
  );

  useEffect(() => {
    getElections()
      .then((data) => {
        const list = data || [];
        setElections(list);

        const presetElectionId = searchParams.get("election");
        const now = new Date();
        const activePublishedElection =
          list.find(
            (election) =>
              election.candidates_visible &&
              now <= new Date(election.voting_end)
          ) || list.find((election) => election.candidates_visible);

        const initialElectionId =
          presetElectionId &&
          list.some((election) => String(election.id) === String(presetElectionId) && election.candidates_visible)
            ? presetElectionId
            : activePublishedElection?.id;

        if (initialElectionId) {
          loadCandidates(String(initialElectionId));
        }
      })
      .catch(() => setError("Failed to load elections"));
  }, [searchParams]);

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

      <div className="card form-shell">
        <div className="section-head">
          <h2>Election Candidates</h2>
          <p className="hint">See only approved candidates grouped by post.</p>
        </div>

        <select
          value={electionId}
          onChange={(e) => loadCandidates(e.target.value)}
        >
          <option value="">Select Election</option>

          {publishedElections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} - {e.year}
            </option>
          ))}
        </select>

        {Object.keys(groups).map((postName) => (
          <div key={postName} className="post-section">
            <div className="section-head">
              <h2>{postName}</h2>
              <span className="badge">{groups[postName].length} candidates</span>
            </div>

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
