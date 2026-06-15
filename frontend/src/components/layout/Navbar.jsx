import { Link } from "react-router-dom";
import { getRole, isLoggedIn, logout } from "../../utils/auth";

export default function Navbar() {
  const role = getRole();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">College Election</Link>

      <div className="nav-links">
        {!isLoggedIn() && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}

        {role === "student" && (
          <>
            <Link to="/elections">Elections</Link>
            <Link to="/apply">Apply</Link>
            <Link to="/vote">Vote</Link>
            <Link to="/results">Results</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/students">Students</Link>
            <Link to="/admin-applications">Applications</Link>
            <Link to="/admin-publish">Publish</Link>
            <Link to="/results">Results</Link>
          </>
        )}

        {isLoggedIn() && (
          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
