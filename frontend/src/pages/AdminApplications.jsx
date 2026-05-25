import { useEffect, useState } from "react";
import { getAllApplications } from "../api/adminService";
import { reviewCandidate } from "../api/candidateService";

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
          <h2>{postName}</h2>

          {groups[postName].map((c, index) => (
            <div className="row" key={`${postName}-${c.id}-${index}`}>
              <div>
                <h3>{c.candidate_name}</h3>
                <p>College Email: {c.college_email}</p>
                <p>Roll: {c.roll_number}</p>
                <p>Status: {c.status}</p>
                <p>
                  Applied:{" "}
                  {c.applied_at
                    ? new Date(c.applied_at).toLocaleString()
                    : "N/A"}
                </p>

                {c.rejection_reason && (
                  <p>Reason: {c.rejection_reason}</p>
                )}
              </div>

              {c.status === "pending" && (
                <div>
                  <button onClick={() => review(c.id, "approved")}>
                    Approve
                  </button>

                  <button
                    className="danger"
                    onClick={() => review(c.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}