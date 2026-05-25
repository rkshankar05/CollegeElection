import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authService";

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
        <h1>Create Account</h1>
        <p>Register as student</p>

        {error && <div className="error">{error}</div>}
        {msg && <div className="success">{msg}</div>}

        <form onSubmit={submit}>
          <label>Name</label>
          <input
            placeholder="Enter name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <label>Roll Number</label>
          <input
            placeholder="Enter roll number"
            value={form.roll_number}
            onChange={(e) =>
              setForm({ ...form, roll_number: e.target.value })
            }
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <button className="full-btn">Register</button>
        </form>

        <p className="auth-link">
          Already have account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}