import { useEffect, useState } from "react";
import {
  addStudent,
  uploadStudentsFile,
  createElection,
  updateElection,
  createPost,
} from "../services/adminService";
import { getElections } from "../../elections/services/electionService";
import "../styles/admin.css";

export default function AdminDashboard() {
  const [openForm, setOpenForm] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [studentFile, setStudentFile] = useState(null);
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");

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
    voting_date: "",
    voting_start_time: "10:00",
    voting_end_time: "17:00",
  });

  const [post, setPost] = useState({
    election_id: "",
    name: "",
    display_order: 0,
  });

  useEffect(() => {
    loadElections();
  }, []);

  function getDashboardElection() {
    if (!elections.length) {
      return null;
    }

    const now = new Date();
    return (
      elections.find((item) => {
        const applicationStart = new Date(item.application_start);
        const votingEnd = new Date(item.voting_end);
        return now >= applicationStart && now <= votingEnd;
      }) || elections[0]
    );
  }

  function formatDateTime(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleString();
  }

  function formatDate(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleDateString();
  }

  function formatTime(value) {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  async function loadElections() {
    try {
      const data = await getElections();
      setElections(data || []);
    } catch {
      setElections([]);
    }
  }

  function splitDateTime(value) {
    if (!value) {
      return { date: "", time: "" };
    }

    const dateValue = new Date(value);
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    const hours = String(dateValue.getHours()).padStart(2, "0");
    const minutes = String(dateValue.getMinutes()).padStart(2, "0");

    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
    };
  }

  function combineDateAndTime(dateValue, timeValue) {
    return `${dateValue}T${timeValue}`;
  }

  function resetElectionForm() {
    setSelectedElectionId("");
    setElection({
      title: "",
      year: "",
      application_start: "",
      application_deadline: "",
      voting_date: "",
      voting_start_time: "10:00",
      voting_end_time: "17:00",
    });
  }

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
      !election.voting_date ||
      !election.voting_start_time ||
      !election.voting_end_time
    ) {
      setError("Please fill all required election fields");
      setMsg("");
      return;
    }

    const votingStart = combineDateAndTime(
      election.voting_date,
      election.voting_start_time
    );
    const votingEnd = combineDateAndTime(
      election.voting_date,
      election.voting_end_time
    );

    try {
      const payload = {
        ...election,
        year: Number(election.year),
        voting_start: votingStart,
        voting_end: votingEnd,
      };

      delete payload.voting_date;
      delete payload.voting_start_time;
      delete payload.voting_end_time;

      if (selectedElectionId) {
        await updateElection(selectedElectionId, payload);
        setMsg("Election updated successfully");
      } else {
        await createElection(payload);
        setMsg("Election created successfully");
      }

      setError("");
      setOpenForm(null);
      resetElectionForm();
      loadElections();
    } catch (err) {
      showError(err, selectedElectionId ? "Failed to update election" : "Failed to create election");
    }
  }

  function handleElectionSelection(electionId) {
    setSelectedElectionId(electionId);

    if (!electionId) {
      resetElectionForm();
      return;
    }

    const selected = elections.find((item) => String(item.id) === String(electionId));
    if (!selected) {
      return;
    }

    const applicationStart = splitDateTime(selected.application_start);
    const applicationDeadline = splitDateTime(selected.application_deadline);
    const votingStart = splitDateTime(selected.voting_start);
    const votingEnd = splitDateTime(selected.voting_end);

    setElection({
      title: selected.title || "",
      year: String(selected.year || ""),
      application_start: applicationStart.date
        ? `${applicationStart.date}T${applicationStart.time}`
        : "",
      application_deadline: applicationDeadline.date
        ? `${applicationDeadline.date}T${applicationDeadline.time}`
        : "",
      voting_date: votingStart.date || "",
      voting_start_time: votingStart.time || "10:00",
      voting_end_time: votingEnd.time || "17:00",
    });
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

  function renderActiveForm() {
    if (!openForm) {
      return null;
    }

    if (openForm === "student") {
      return (
        <section className="card dashboard-workspace">
          <div className="dashboard-workspace-head">
            <div>
              <p className="profile-kicker">Student Entry</p>
              <h2>Add Single Student</h2>
              <p className="hint">
                Add one verified record to the official student list.
              </p>
            </div>
            <button type="button" className="ghost-btn" onClick={() => setOpenForm(null)}>
              Close Form
            </button>
          </div>

          <form className="form-box elevated-form dashboard-form-panel" onSubmit={submitStudent}>
            <div className="dashboard-form-grid">
              <div>
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
              </div>

              <div>
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
              </div>

              <div className="dashboard-form-grid-full">
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
              </div>
            </div>

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

            <div className="dashboard-form-actions">
              <button type="submit">Save Student</button>
            </div>
          </form>
        </section>
      );
    }

    if (openForm === "upload") {
      return (
        <section className="card dashboard-workspace">
          <div className="dashboard-workspace-head">
            <div>
              <p className="profile-kicker">Bulk Upload</p>
              <h2>Upload Student File</h2>
              <p className="hint">
                Import CSV or Excel and create many student records in one step.
              </p>
            </div>
            <button type="button" className="ghost-btn" onClick={() => setOpenForm(null)}>
              Close Upload
            </button>
          </div>

          <form className="form-box elevated-form dashboard-form-panel" onSubmit={submitUpload}>
            <label>Select CSV / Excel File *</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setStudentFile(e.target.files[0])}
            />

            <p className="hint">
              Required columns: roll_number, college_email, name, has_active_backlog
            </p>

            <div className="dashboard-form-actions">
              <button type="submit">Upload Students</button>
            </div>
          </form>
        </section>
      );
    }

    if (openForm === "election") {
      return (
        <section className="card dashboard-workspace dashboard-workspace-wide">
          <div className="dashboard-workspace-head">
            <div>
              <p className="profile-kicker">Election Setup</p>
              <h2>Manage Election Timeline</h2>
              <p className="hint">
                Create a new election or update an existing timeline without squeezing the form into a card.
              </p>
            </div>
            <button type="button" className="ghost-btn" onClick={() => setOpenForm(null)}>
              Close Form
            </button>
          </div>

          <form className="form-box elevated-form dashboard-form-panel" onSubmit={submitElection}>
            <div className="dashboard-form-grid">
              <div className="dashboard-form-grid-full">
                <label>Edit Existing Election</label>
                <select
                  value={selectedElectionId}
                  onChange={(e) => handleElectionSelection(e.target.value)}
                >
                  <option value="">Create new election</option>
                  {elections.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} - {item.year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
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
              </div>

              <div>
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
              </div>

              <div>
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
              </div>

              <div>
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
              </div>

              <div className="dashboard-form-grid-full">
                <label>Voting Date *</label>
                <input
                  type="date"
                  value={election.voting_date}
                  onChange={(e) =>
                    setElection({
                      ...election,
                      voting_date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Voting Start Time *</label>
                <input
                  type="time"
                  value={election.voting_start_time}
                  onChange={(e) =>
                    setElection({
                      ...election,
                      voting_start_time: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Voting End Time *</label>
                <input
                  type="time"
                  value={election.voting_end_time}
                  onChange={(e) =>
                    setElection({
                      ...election,
                      voting_end_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="dashboard-note-band">
              <strong>Voting Rule</strong>
              <span>
                Start and end must be on the same date. Admin can decide the voting time window.
              </span>
            </div>

            <div className="dashboard-form-actions">
              <button type="submit">
                {selectedElectionId ? "Update Election" : "Save Election"}
              </button>
              {selectedElectionId && (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={resetElectionForm}
                >
                  Switch To Create Mode
                </button>
              )}
            </div>
          </form>
        </section>
      );
    }

    if (openForm === "post") {
      return (
        <section className="card dashboard-workspace">
          <div className="dashboard-workspace-head">
            <div>
              <p className="profile-kicker">Post Setup</p>
              <h2>Create Election Post</h2>
              <p className="hint">
                Add a post under an election and control its display order.
              </p>
            </div>
            <button type="button" className="ghost-btn" onClick={() => setOpenForm(null)}>
              Close Form
            </button>
          </div>

          <form className="form-box elevated-form dashboard-form-panel" onSubmit={submitPost}>
            <div className="dashboard-form-grid">
              <div>
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
              </div>

              <div>
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
              </div>

              <div className="dashboard-form-grid-full">
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
              </div>
            </div>

            <div className="dashboard-form-actions">
              <button type="submit">Save Post</button>
            </div>
          </form>
        </section>
      );
    }

    return null;
  }

  const dashboardElection = getDashboardElection();
  const hasActiveElection =
    dashboardElection &&
    new Date() >= new Date(dashboardElection.application_start) &&
    new Date() <= new Date(dashboardElection.voting_end);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="profile-kicker">Administration</p>
          <h1>Admin Dashboard</h1>
          <p className="profile-subtitle">
            Manage students, election timelines, bulk uploads, and post setup
            from one place.
          </p>
        </div>
      </section>

      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <section className="dashboard-ribbon card">
        {dashboardElection ? (
          <>
            <div className="dashboard-ribbon-item dashboard-ribbon-item-hero">
              <span className="dashboard-ribbon-label">
                {hasActiveElection ? "Active Election" : "Latest Election"}
              </span>
              <strong>{dashboardElection.title}</strong>
              <p>{dashboardElection.year}</p>
            </div>
            <div className="dashboard-ribbon-item">
              <span className="dashboard-ribbon-label">Application Deadline</span>
              <strong>{formatDateTime(dashboardElection.application_deadline)}</strong>
              <p>Last time for candidate applications.</p>
            </div>
            <div className="dashboard-ribbon-item">
              <span className="dashboard-ribbon-label">Voting Window</span>
              <strong>{formatDate(dashboardElection.voting_start)}</strong>
              <p>
                {formatTime(dashboardElection.voting_start)} - {formatTime(dashboardElection.voting_end)}
              </p>
            </div>
          </>
        ) : (
          <div className="dashboard-ribbon-item dashboard-ribbon-item-empty">
            <span className="dashboard-ribbon-label">Election Status</span>
            <strong>No election created</strong>
            <p>Create the first election to manage publish, voting, and posts.</p>
          </div>
        )}
      </section>

      <div className="grid dashboard-grid">
        <div className="card admin-tile">
          <div className="admin-tile-head">
            <span className="admin-tile-index">01</span>
            <span className="badge">Single Entry</span>
          </div>
          <div className="admin-tile-copy">
            <h2>Add Student</h2>
            <p className="hint">
              Add one student record manually to the official student list.
            </p>
          </div>

          <button className="tile-cta" onClick={() => toggleForm("student")}>
            {openForm === "student" ? "Close Form" : "Add Single Student"}
          </button>
        </div>

        <div className="card admin-tile">
          <div className="admin-tile-head">
            <span className="admin-tile-index">02</span>
            <span className="badge">CSV / Excel</span>
          </div>
          <div className="admin-tile-copy">
            <h2>Bulk Upload Students</h2>
            <p className="hint">
              Import a prepared spreadsheet to create many student records quickly.
            </p>
          </div>

          <button className="tile-cta" onClick={() => toggleForm("upload")}>
            {openForm === "upload" ? "Close Upload" : "Upload CSV / Excel"}
          </button>
        </div>

        <div className="card admin-tile">
          <div className="admin-tile-head">
            <span className="admin-tile-index">03</span>
            <span className="badge">Timeline Setup</span>
          </div>
          <div className="admin-tile-copy">
            <h2>Create Election</h2>
            <p className="hint">
              Configure or update the application deadline and same-day voting window for an election year.
            </p>
          </div>

          <button className="tile-cta" onClick={() => toggleForm("election")}>
            {openForm === "election" ? "Close Form" : "Manage Election"}
          </button>
        </div>

        <div className="card admin-tile">
          <div className="admin-tile-head">
            <span className="admin-tile-index">04</span>
            <span className="badge">Role Setup</span>
          </div>
          <div className="admin-tile-copy">
            <h2>Create Post</h2>
            <p className="hint">
              Add a post under an election and control its display order.
            </p>
          </div>

          <button className="tile-cta" onClick={() => toggleForm("post")}>
            {openForm === "post" ? "Close Form" : "Create Post"}
          </button>
        </div>
      </div>

      {renderActiveForm()}
    </div>
  );
}
