import { useState } from "react";
import {
  addStudent,
  uploadStudentsFile,
  createElection,
  createPost,
} from "../api/adminService";

export default function AdminDashboard() {
  const [openForm, setOpenForm] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [studentFile, setStudentFile] = useState(null);

  const [student, setStudent] = useState({
    roll_number: "",
    college_email: "",
    name: "",
    has_active_backlog: false,
  });

  const [election, setElection] = useState({
    title: "",
    year: "",
    application_start: "",
    application_deadline: "",
    voting_start: "",
    voting_end: "",
  });

  const [post, setPost] = useState({
    election_id: "",
    name: "",
    display_order: 0,
  });

  function toggleForm(name) {
    setError("");
    setMsg("");
    setOpenForm(openForm === name ? null : name);
  }

  function showError(err, fallback = "Action failed") {
    setMsg("");

    const detail = err?.response?.data?.detail;

    if (Array.isArray(detail)) {
      setError(detail.map((x) => x.msg).join(", "));
    } else {
      setError(detail || fallback);
    }
  }

  async function submitStudent(e) {
    e.preventDefault();

    if (!student.roll_number || !student.college_email || !student.name) {
      setError("Roll number, college email and name are required");
      setMsg("");
      return;
    }

    try {
      await addStudent(student);

      setMsg("Student added successfully");
      setError("");
      setOpenForm(null);

      setStudent({
        roll_number: "",
        college_email: "",
        name: "",
        has_active_backlog: false,
      });
    } catch (err) {
      showError(err, "Failed to add student");
    }
  }

  async function submitUpload(e) {
    e.preventDefault();

    if (!studentFile) {
      setError("Please select CSV or Excel file");
      setMsg("");
      return;
    }

    try {
      await uploadStudentsFile(studentFile);

      setMsg("Students uploaded successfully");
      setError("");
      setOpenForm(null);
      setStudentFile(null);
    } catch (err) {
      showError(err, "Failed to upload students");
    }
  }

  async function submitElection(e) {
    e.preventDefault();

    if (
      !election.title ||
      !election.year ||
      !election.application_start ||
      !election.application_deadline ||
      !election.voting_start ||
      !election.voting_end
    ) {
      setError("Please fill all required election fields");
      setMsg("");
      return;
    }

    try {
      await createElection({
        ...election,
        year: Number(election.year),
      });

      setMsg("Election created successfully");
      setError("");
      setOpenForm(null);

      setElection({
        title: "",
        year: "",
        application_start: "",
        application_deadline: "",
        voting_start: "",
        voting_end: "",
      });
    } catch (err) {
      showError(err, "Failed to create election");
    }
  }

  async function submitPost(e) {
    e.preventDefault();

    if (!post.election_id || !post.name) {
      setError("Election ID and post name are required");
      setMsg("");
      return;
    }

    try {
      await createPost({
        election_id: Number(post.election_id),
        name: post.name,
        display_order: Number(post.display_order || 0),
      });

      setMsg("Post created successfully");
      setError("");
      setOpenForm(null);

      setPost({
        election_id: "",
        name: "",
        display_order: 0,
      });
    } catch (err) {
      showError(err, "Failed to create post");
    }
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <div className="grid">
        <div className="card">
          <h2>Add Student</h2>

          <button onClick={() => toggleForm("student")}>
            {openForm === "student" ? "Close Form" : "Add Single Student"}
          </button>

          {openForm === "student" && (
            <form className="form-box" onSubmit={submitStudent}>
              <label>Roll Number *</label>
              <input
                placeholder="CSE1106"
                value={student.roll_number}
                onChange={(e) =>
                  setStudent({
                    ...student,
                    roll_number: e.target.value,
                  })
                }
              />

              <label>College Email *</label>
              <input
                type="email"
                placeholder="student@college.edu"
                value={student.college_email}
                onChange={(e) =>
                  setStudent({
                    ...student,
                    college_email: e.target.value,
                  })
                }
              />

              <label>Name *</label>
              <input
                placeholder="Student name"
                value={student.name}
                onChange={(e) =>
                  setStudent({
                    ...student,
                    name: e.target.value,
                  })
                }
              />

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={student.has_active_backlog}
                  onChange={(e) =>
                    setStudent({
                      ...student,
                      has_active_backlog: e.target.checked,
                    })
                  }
                />
                Has Active Backlog
              </label>

              <button type="submit">Save Student</button>
            </form>
          )}
        </div>

        <div className="card">
          <h2>Bulk Upload Students</h2>

          <button onClick={() => toggleForm("upload")}>
            {openForm === "upload" ? "Close Upload" : "Upload CSV / Excel"}
          </button>

          {openForm === "upload" && (
            <form className="form-box" onSubmit={submitUpload}>
              <label>Select CSV / Excel File *</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setStudentFile(e.target.files[0])}
              />

              <p className="hint">
                Required columns: roll_number, college_email, name,
                has_active_backlog
              </p>

              <button type="submit">Upload Students</button>
            </form>
          )}
        </div>

        <div className="card">
          <h2>Create Election</h2>

          <button onClick={() => toggleForm("election")}>
            {openForm === "election" ? "Close Form" : "Create Election"}
          </button>

          {openForm === "election" && (
            <form className="form-box" onSubmit={submitElection}>
              <label>Title *</label>
              <input
                placeholder="Student Council Election 2026"
                value={election.title}
                onChange={(e) =>
                  setElection({
                    ...election,
                    title: e.target.value,
                  })
                }
              />

              <label>Year *</label>
              <input
                type="number"
                placeholder="2026"
                value={election.year}
                onChange={(e) =>
                  setElection({
                    ...election,
                    year: e.target.value,
                  })
                }
              />

              <label>Application Start *</label>
              <input
                type="datetime-local"
                value={election.application_start}
                onChange={(e) =>
                  setElection({
                    ...election,
                    application_start: e.target.value,
                  })
                }
              />

              <label>Application Deadline *</label>
              <input
                type="datetime-local"
                value={election.application_deadline}
                onChange={(e) =>
                  setElection({
                    ...election,
                    application_deadline: e.target.value,
                  })
                }
              />

              <label>Voting Start *</label>
              <input
                type="datetime-local"
                value={election.voting_start}
                onChange={(e) =>
                  setElection({
                    ...election,
                    voting_start: e.target.value,
                  })
                }
              />

              <label>Voting End *</label>
              <input
                type="datetime-local"
                value={election.voting_end}
                onChange={(e) =>
                  setElection({
                    ...election,
                    voting_end: e.target.value,
                  })
                }
              />

              <button type="submit">Save Election</button>
            </form>
          )}
        </div>

        <div className="card">
          <h2>Create Post</h2>

          <button onClick={() => toggleForm("post")}>
            {openForm === "post" ? "Close Form" : "Create Post"}
          </button>

          {openForm === "post" && (
            <form className="form-box" onSubmit={submitPost}>
              <label>Election ID *</label>
              <input
                type="number"
                placeholder="1"
                value={post.election_id}
                onChange={(e) =>
                  setPost({
                    ...post,
                    election_id: e.target.value,
                  })
                }
              />

              <label>Post Name *</label>
              <input
                placeholder="President"
                value={post.name}
                onChange={(e) =>
                  setPost({
                    ...post,
                    name: e.target.value,
                  })
                }
              />

              <label>Display Order</label>
              <input
                type="number"
                placeholder="1"
                value={post.display_order}
                onChange={(e) =>
                  setPost({
                    ...post,
                    display_order: e.target.value,
                  })
                }
              />

              <button type="submit">Save Post</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}