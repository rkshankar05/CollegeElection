import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    setError("");

    try {
      const data =
        await loginUser(
          email,
          password
        );

      if (
        !data ||
        !data.access_token
      ) {
        setError(
          "Backend returned no token"
        );

        return;
      }

      localStorage.setItem(
        "token",
        data.access_token
      );

      navigate("/");

      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Login failed"
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-top">
          <span className="auth-eyebrow">Student Access</span>
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to apply, vote during the live window, and track your election activity.
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your college email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="full-btn">Login</button>
        </form>

        <p className="auth-link">
          New student? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
