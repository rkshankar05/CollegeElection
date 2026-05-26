import { useEffect, useState } from "react";
import { getAllApplications } from "../services/adminService";
import { reviewCandidate } from "../../candidates/services/candidateService";
import "../../../styles/admin.css";

export default function AdminApplications() {
  const [groups, setGroups] = useState({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function loadApps() {
    try {
      const data = await getAllApplications();
      setGroups(data || {});
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load applications");
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  async function review(id, status) {
    try {
      const payload = { status };

      if (status === "rejected") {
        payload.rejection_reason = prompt("Reason") || "Rejected";
      }

      await reviewCandidate(id, payload);

      setMsg(`Candidate ${status}`);
      setError("");
      loadApps();
    } catch (err) {
      setError(err.response?.data?.detail || "Review failed");
      setMsg("");
    }
  }

  return (
    <div>
      <h1>Candidate Applications</h1>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      {Object.keys(groups).length === 0 && (
        <div className="card">
          <p>No candidate applications found.</p>
        </div>
      )}

      {Object.keys(groups).map((postName) => (
        <div className="card" key={postName}>
          <div className="section-head">
            <h2>{postName}</h2>
            <span className="badge">{groups[postName].length} applications</span>
          </div>

          <div className="stack-list">
            {groups[postName].map((c, index) => {
              const status = c.status || "pending";

              return (
                <article className="entity-card" key={`${postName}-${c.id}-${index}`}>
                  <div className="entity-main">
                    <h3>{c.candidate_name}</h3>
                    <p><b>Email:</b> {c.email || c.college_email || "N/A"}</p>
                    <p><b>Roll:</b> {c.roll_number}</p>
                    <p><b>Backlog:</b> {c.has_active_backlog ? "Yes" : "No"}</p>
                    <p>
                      <b>Status:</b>{" "}
                      <span className={`inline-status inline-status-${status}`}>
                        {status}
                      </span>
                    </p>
                    <p><b>Applied:</b>{" "}
                      {c.applied_at
                        ? new Date(c.applied_at).toLocaleString()
                        : "N/A"}
                    </p>

                    {c.rejection_reason && (
                      <p><b>Reason:</b> {c.rejection_reason}</p>
                    )}
                  </div>

                  <div className="entity-actions">
                    <button
                      onClick={() => review(c.id, "approved")}
                      disabled={status === "approved"}
                    >
                      {status === "approved" ? "Approved" : "Approve"}
                    </button>

                    <button
                      className="danger"
                      onClick={() => review(c.id, "rejected")}
                      disabled={status === "rejected"}
                    >
                      {status === "rejected" ? "Rejected" : "Reject"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
