import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/authService";

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

    console.log(
      "LOGIN RESPONSE:",
      data
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

    console.log(
      "TOKEN SAVED"
    );

    navigate("/");

    setTimeout(() => {
      window.location.reload();
    }, 100);

  } catch (err) {

    console.log(
      "FULL LOGIN ERROR",
      err
    );

    setError(
      JSON.stringify(
        err.response?.data
      ) ||
      "Login failed"
    );
  }
}

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>

        {error && <div className="error">{error}</div>}

        <form onSubmit={submit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="full-btn">Login</button>
        </form>

        <p className="auth-link">
          New student? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}