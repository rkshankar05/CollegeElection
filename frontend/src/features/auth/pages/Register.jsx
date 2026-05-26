import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roll_number: "",
  });

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.roll_number) {
      setError("All fields are required");
      return;
    }

    try {
      await registerUser(form);

      setMsg("Registration successful. Please login.");
      setError("");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
      setMsg("");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-top">
          <span className="auth-eyebrow">Student Registration</span>
          <h1>Create Account</h1>
          <p className="auth-subtitle">
            Register with your official student details to unlock applications, voting, and results.
          </p>
        </div>

        {error && <div className="error">{error}</div>}
        {msg && <div className="success">{msg}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="auth-grid">
            <div className="auth-field">
              <label>Name</label>
              <input
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div className="auth-field">
              <label>Roll Number</label>
              <input
                placeholder="Enter roll number"
                value={form.roll_number}
                onChange={(e) =>
                  setForm({ ...form, roll_number: e.target.value })
                }
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your college email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a secure password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </div>

          <button className="full-btn">Register</button>
        </form>

        <p className="auth-link">
          Already have account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
