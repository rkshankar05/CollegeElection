import { useEffect, useState } from "react";
import { getMyApplications } from "../api/candidateService";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");

  async function loadApplications() {
    try {
      const data = await getMyApplications();
      setApplications(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load applications");
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div>
      <h1>My Applications</h1>

      {error && <div className="error">{error}</div>}

      <div className="card">
        {applications.length === 0 ? (
          <p>No application submitted yet.</p>
        ) : (
          <div className="stack-list">
            {applications.map((app) => (
              <article className="entity-card entity-card-wide" key={app.id}>
                <div className="entity-main">
                  <div className="section-head">
                    <h3>{app.candidate_name || "Candidate"}</h3>
                    <span className={`inline-status inline-status-${app.status || "pending"}`}>
                      {app.status || "pending"}
                    </span>
                  </div>

                  <p><b>Election:</b> {app.election}</p>
                  <p>
                    <b>Applied At:</b>{" "}
                    {app.applied_at
                      ? new Date(app.applied_at).toLocaleString()
                      : "N/A"}
                  </p>

                  <div className="post-review-grid">
                    {(app.posts || []).map((post) => (
                      <div className="review-card" key={post.candidate_post_id}>
                        <p className="candidate-meta">Applied Post</p>
                        <h4>{post.post_name}</h4>
                        <p>
                          <b>Status:</b>{" "}
                          <span className={`inline-status inline-status-${post.status || "pending"}`}>
                            {post.status || "pending"}
                          </span>
                        </p>
                        <p>
                          <b>Reviewed At:</b>{" "}
                          {post.reviewed_at
                            ? new Date(post.reviewed_at).toLocaleString()
                            : "Not reviewed yet"}
                        </p>
                        {post.rejection_reason && (
                          <p><b>Reason:</b> {post.rejection_reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
