import { useEffect, useState } from "react";
import { getProfile } from "../api/authService";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to load profile");
      });
  }, []);

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div>
          <p className="profile-kicker">Student Profile</p>
          <h1>Profile</h1>
          <p className="profile-subtitle">
            Your official student details and active election achievements.
          </p>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      {!profile ? (
        <div className="card">
          <p>Loading profile...</p>
        </div>
      ) : (
        <div className="profile-layout">
          <section className="card profile-summary-card">
            <div className="profile-summary-top">
              <div>
                <p className="profile-eyebrow">Student</p>
                <h2>{profile.name}</h2>
              </div>

              <div className="profile-badge-stack">
                <span className={`status-pill ${profile.candidate_blocked ? "status-pill-blocked" : "status-pill-open"}`}>
                  {profile.candidate_blocked ? "Candidate Access Blocked" : "Candidate Access Allowed"}
                </span>
                <span className={`status-pill ${profile.has_active_backlog ? "status-pill-warning" : "status-pill-open"}`}>
                  {profile.has_active_backlog ? "Backlog Active" : "No Backlog"}
                </span>
              </div>
            </div>

            <div className="profile-grid">
              <div className="profile-panel">
                <p className="profile-label">Name</p>
                <p className="profile-value">{profile.name}</p>
              </div>

              <div className="profile-panel">
                <p className="profile-label">College Email</p>
                <p className="profile-value">{profile.college_email || "N/A"}</p>
              </div>

              <div className="profile-panel">
                <p className="profile-label">Roll Number</p>
                <p className="profile-value">{profile.roll_number || "N/A"}</p>
              </div>

              <div className="profile-panel">
                <p className="profile-label">Backlog</p>
                <p className="profile-value">
                  {profile.has_active_backlog ? "Active backlog" : "No backlog"}
                </p>
              </div>
            </div>
          </section>

          {profile.active_posts?.length > 0 && (
            <section className="card profile-achievement-card">
              <div className="profile-section-head">
                <p className="profile-kicker">Leadership</p>
                <h3>Current Won Posts</h3>
              </div>

              <div className="winner-grid">
                {profile.active_posts.map((post) => (
                  <article
                    className="winner-card"
                    key={`${post.election_id}-${post.post_id}`}
                  >
                    <p className="winner-tag">Winner</p>
                    <h4>{post.post_name}</h4>
                    <p>
                      {post.election_title} - {post.election_year}
                    </p>
                    <p>Total Votes: {post.total_votes}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
