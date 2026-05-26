import { useEffect, useState } from "react";
import { getElections, getElectionPosts } from "../features/elections/services/electionService";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const elections = await getElections();

      if (!elections.length) {
        setPosts([]);
        return;
      }

      const latestElection = elections[elections.length - 1];
      const data = await getElectionPosts(latestElection.id);

      setPosts(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load posts");
    }
  }

  return (
    <div>
      <h1>Posts</h1>

      {error && <div className="error">{error}</div>}

      <div className="post-grid">
        {posts.map((post) => (
          <div className="card" key={post.id}>
            <h2>{post.name}</h2>
            <p>Post ID: {post.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
