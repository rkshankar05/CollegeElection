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
          applications.map((app) => (
            <div className="row" key={app.id}>
              <div>
                <b>{app.candidate_name || "Candidate"}</b>
                <p>Status: {app.status}</p>
                <p>Applied At: {app.applied_at}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}