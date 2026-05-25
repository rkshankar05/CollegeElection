import { useEffect, useState } from "react";
import {
  getAllStudents,
  deleteStudent,
  updateCandidateBlock,
} from "../api/adminService";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function loadStudents() {
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load students");
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function removeStudent(id) {
    if (!confirm("Delete this student?")) return;

    try {
      await deleteStudent(id);

      setStudents((prev) =>
        prev.filter((student) => student.id !== id)
      );

      setMsg("Student deleted successfully");
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed");
      setMsg("");
    }
  }

  async function toggleBlock(student) {
    try {
      const newValue = !student.candidate_blocked;

      let reason = null;

      if (newValue) {
        reason = prompt("Reason for blocking?") || "Blocked by admin";
      }

      await updateCandidateBlock(student.id, newValue, reason);

      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id
            ? {
                ...s,
                candidate_blocked: newValue,
                block_reason: reason,
              }
            : s
        )
      );

      setMsg(newValue ? "Student blocked" : "Student unblocked");
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed");
      setMsg("");
    }
  }

  return (
    <div>
      <h1>All Students</h1>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <div className="card">
        {students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          students.map((s) => (
            <div className="row" key={s.id}>
              <div>
                <h3>{s.name || "Not Registered"}</h3>

                <p>
                  Registration:{" "}
                  <b>{s.registered ? "Registered" : "Not Registered"}</b>
                </p>

                <p>User ID: {s.user_id || "N/A"}</p>
                <p>Email: {s.email || "N/A"}</p>
                <p>College Email: {s.college_email}</p>
                <p>Roll: {s.roll_number}</p>
                <p>Role: {s.role || "N/A"}</p>
                <p>Verified: {s.is_verified ? "Yes" : "No"}</p>
                <p>Backlog: {s.has_active_backlog ? "Yes" : "No"}</p>

                <p>
                  In Election:{" "}
                  <b>{s.candidate_blocked ? "Not Allowed" : "Allowed"}</b>
                </p>

                {s.block_reason && <p>Reason: {s.block_reason}</p>}
              </div>

              <div>
                <button onClick={() => toggleBlock(s)}>
                  {s.candidate_blocked ? "Unblock" : "Block"}
                </button>

                <button
                  className="danger"
                  onClick={() => removeStudent(s.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}