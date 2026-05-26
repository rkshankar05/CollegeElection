import { useEffect, useState } from "react";
import {
  getAllStudents,
  deleteStudent,
  updateStudent,
} from "../services/adminService";
import "../styles/admin.css";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    college_email: "",
    has_active_backlog: false,
  });

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

  function startEdit(student) {
    setEditingId(student.id);
    setForm({
      name: student.name || "",
      roll_number: student.roll_number || "",
      college_email: student.college_email || "",
      has_active_backlog: !!student.has_active_backlog,
    });
    setError("");
    setMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      name: "",
      roll_number: "",
      college_email: "",
      has_active_backlog: false,
    });
  }

  async function saveEdit(studentId) {
    if (!form.name || !form.roll_number || !form.college_email) {
      setError("Name, roll number and college email are required");
      setMsg("");
      return;
    }

    try {
      const updated = await updateStudent(studentId, form);

      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? {
                ...student,
                name: updated.name,
                roll_number: updated.roll_number,
                college_email: updated.college_email,
                email: updated.college_email,
                has_active_backlog: updated.has_active_backlog,
              }
            : student
        )
      );

      setMsg("Student updated successfully");
      setError("");
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed");
      setMsg("");
    }
  }

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

  return (
    <div>
      <h1>All Students</h1>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <div className="card">
        {students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <div className="stack-list">
            {students.map((s) => (
              <article className="entity-card student-entity-card" key={s.id}>
                <div className="entity-main">
                  <div className="student-card-head">
                    <h3>{s.name || "Not Registered"}</h3>
                  </div>

                  <div className="detail-grid">
                    <p><b>College Email:</b> {s.college_email}</p>
                    <p><b>Roll:</b> {s.roll_number}</p>
                    <p><b>Backlog:</b> {s.has_active_backlog ? "Yes" : "No"}</p>
                    {s.email && s.email !== s.college_email && (
                      <p><b>Email:</b> {s.email}</p>
                    )}
                  </div>

                  {editingId === s.id && (
                    <div className="inline-editor">
                      <label>Name</label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />

                      <label>Roll Number</label>
                      <input
                        value={form.roll_number}
                        onChange={(e) =>
                          setForm({ ...form, roll_number: e.target.value })
                        }
                      />

                      <label>College Email</label>
                      <input
                        type="email"
                        value={form.college_email}
                        onChange={(e) =>
                          setForm({ ...form, college_email: e.target.value })
                        }
                      />

                      <div className="action-row">
                        <button onClick={() => saveEdit(s.id)}>Save</button>
                        <button className="ghost-btn" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="student-status-col">
                  <span className={`inline-status ${s.registered ? "inline-status-approved" : "inline-status-pending"}`}>
                    {s.registered ? "Registered" : "Not Registered"}
                  </span>
                </div>

                <div className="entity-actions entity-actions-compact">
                  <button onClick={() => startEdit(s)}>
                    {editingId === s.id ? "Editing" : "Edit"}
                  </button>

                  <button
                    className="danger"
                    onClick={() => removeStudent(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
