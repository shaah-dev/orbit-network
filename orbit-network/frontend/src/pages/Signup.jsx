import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import AuthBrandPanel from "../components/AuthBrandPanel.jsx";

export default function Signup() {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <AuthBrandPanel />

      <div className="auth-form-panel">
        <button className="icon-btn theme-toggle-floating" onClick={toggleTheme}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <div className="auth-form-box">
          <h2>Create your account</h2>
          <p className="subtitle">It only takes a moment to join the network.</p>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <input className="input" value={form.name} onChange={update("name")} required />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input className="input" value={form.username} onChange={update("username")} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={update("email")} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="input" type="password" value={form.password} onChange={update("password")} required minLength={6} />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
