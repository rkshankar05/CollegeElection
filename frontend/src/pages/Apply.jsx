import { useEffect, useState } from "react";
import { getElections, getElectionPosts } from "../api/electionService";
import { applyCandidate } from "../api/candidateService";

export default function Apply() {
  const [elections, setElections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadElections();
  }, []);

  async function loadElections() {
    try {
      const data = await getElections();
      setElections(data);
    } catch {
      setError("Failed to load elections");
    }
  }

  async function handleElectionChange(e) {
    const id = e.target.value;
    setElectionId(id);
    setSelectedPosts([]);
    setMsg("");
    setError("");

    if (!id) {
      setPosts([]);
      return;
    }

    try {
      const data = await getElectionPosts(id);
      setPosts(data);
    } catch {
      setError("Failed to load posts");
    }
  }

  function togglePost(postId) {
    if (selectedPosts.includes(postId)) {
      setSelectedPosts(selectedPosts.filter((id) => id !== postId));
      return;
    }

    if (selectedPosts.length >= 2) {
      setError("You can apply for maximum 2 posts only");
      return;
    }

    setError("");
    setSelectedPosts([...selectedPosts, postId]);
  }

  async function submit(e) {
    e.preventDefault();

    if (!electionId) {
      setError("Please select an election");
      return;
    }

    if (selectedPosts.length === 0) {
      setError("Please select at least one post");
      return;
    }

    try {
      await applyCandidate({
        election_id: Number(electionId),
        post_ids: selectedPosts.map(Number),
      });

      setMsg("Application submitted successfully");
      setError("");
      setSelectedPosts([]);
    } catch (err) {
      setError(err.response?.data?.detail || "Application failed");
      setMsg("");
    }
  }

  return (
    <div>
      <h1>Apply for Candidate</h1>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <form className="card apply-card" onSubmit={submit}>
        <label>Select Election *</label>

        <select value={electionId} onChange={handleElectionChange}>
          <option value="">Choose election</option>

          {elections.map((election) => (
            <option key={election.id} value={election.id}>
              {election.title} - {election.year}
            </option>
          ))}
        </select>

        <div className="apply-header">
          <h2>Select Posts</h2>
          <span>{selectedPosts.length}/2 selected</span>
        </div>

        <div className="post-grid">
          {posts.map((post) => {
            const checked = selectedPosts.includes(post.id);

            return (
              <div
                key={post.id}
                className={`post-select-card ${checked ? "selected" : ""}`}
                onClick={() => togglePost(post.id)}
              >
                <h3>{post.name}</h3>
                <p>Post ID: {post.id}</p>

                <button type="button">
                  {checked ? "Selected" : "Select"}
                </button>
              </div>
            );
          })}
        </div>

        <button className="submit-btn" type="submit">
          Submit Application
        </button>
      </form>
    </div>
  );
}