import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getElections, getElectionPosts } from "../../elections/services/electionService";
import { applyCandidate } from "../services/candidateService";
import "../../../styles/candidate.css";

export default function Apply() {
  const [searchParams] = useSearchParams();
  const [currentElection, setCurrentElection] = useState(null);
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
      const openElections = (data || []).filter((election) => election.status === "APPLICATION_OPEN");
      const presetElectionId = searchParams.get("election");

      const selectedElection =
        openElections.find((election) => String(election.id) === String(presetElectionId)) ||
        openElections[0] ||
        null;

      setCurrentElection(selectedElection);

      if (selectedElection) {
        await loadPostsForElection(selectedElection.id);
        return;
      }

      setElectionId("");
      setPosts([]);
      setSelectedPosts([]);
      setError("");
    } catch {
      setError("Failed to load elections");
    }
  }

  async function loadPostsForElection(id) {
    setElectionId(String(id));
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

      {!currentElection ? (
        <div className="card empty-state">
          <h2>Applications Not Open</h2>
          <p>Candidate applications will appear here after admin opens the application phase.</p>
        </div>
      ) : (
        <form className="card apply-card" onSubmit={submit}>
          <div className="section-head">
            <h2>{currentElection.title}</h2>
            <p className="hint">Election {currentElection.year}</p>
          </div>

          <>
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
            {posts.length === 0 && (
              <div className="empty-state">
                <h3>No posts available</h3>
                <p>Admin needs to create posts once. They will be reused for elections automatically.</p>
              </div>
            )}
          </>

          <button className="submit-btn" type="submit" disabled={posts.length === 0}>
            Submit Application
          </button>
        </form>
      )}
    </div>
  );
}
