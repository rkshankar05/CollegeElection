import { useEffect, useState } from "react";
import { getAllApplications } from "../services/adminService";
import { reviewCandidate } from "../../candidates/services/candidateService";
import { getElections } from "../../elections/services/electionService";
import "../../../styles/admin.css";

const reviewableStatuses = new Set(["APPLICATION_OPEN", "APPLICATION_CLOSED"]);

export default function AdminApplications() {
  const [groups, setGroups] = useState({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [loading, setLoading] = useState(false);

  async function loadApps() {
    setLoading(true);
    try {
      const [data, electionData] = await Promise.all([
        getAllApplications(),
        getElections(),
      ]);
      const reviewableElectionIds = new Set(
        (electionData || [])
          .filter((election) => reviewableStatuses.has(election.status))
          .map((election) => Number(election.id))
      );
      const sourceGroups = Array.isArray(data) ? { Applications: data } : data || {};
      const filteredGroups = {};

      Object.entries(sourceGroups).forEach(([groupName, applications]) => {
        const filtered = (applications || []).filter(
          (application) =>
            application.election_id &&
            reviewableElectionIds.has(Number(application.election_id))
        );
        if (filtered.length > 0) {
          filteredGroups[groupName] = filtered;
        }
      });

      setGroups(filteredGroups);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApps();
  }, []);

  async function review(id, status) {
    try {
      const payload = { status };

      if (status === "rejected") {
        payload.rejection_reason = rejectionReasons[id] || "Rejected by admin";
      }

      await reviewCandidate(id, payload);

      setMsg(`Candidate ${status}`);
      setError("");
      setRejectionReasons({ ...rejectionReasons, [id]: "" });
      loadApps();
    } catch (err) {
      setError(err.response?.data?.detail || "Review failed");
      setMsg("");
    }
  }

  return (
    <div>
      <div className="section-head">
        <h1>Candidate Applications</h1>
        <button type="button" className="ghost-btn" onClick={loadApps}>
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      {loading && (
        <div className="card empty-state">
          <p>Loading candidate applications...</p>
        </div>
      )}

      {!loading && Object.keys(groups).length === 0 && (
        <div className="card empty-state">
          <h2>No candidate applications found</h2>
          <p>Only candidates from active application-review elections are shown here.</p>
        </div>
      )}

      {!loading && Object.keys(groups).map((postName) => (
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
                    <p><b>Election:</b> {c.election_title} ({c.election_year})</p>
                    <p><b>Post:</b> {c.post_name}</p>
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
                    <input
                      placeholder="Rejection reason"
                      value={rejectionReasons[c.id] || ""}
                      onChange={(e) =>
                        setRejectionReasons({
                          ...rejectionReasons,
                          [c.id]: e.target.value,
                        })
                      }
                    />
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
