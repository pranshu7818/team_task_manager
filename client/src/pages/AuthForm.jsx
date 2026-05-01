import { ClipboardCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../state/AuthContext.jsx";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member"
  });

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (isSignup) {
        await signup(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-panel">
        <div className="auth-brand">
          <ClipboardCheck size={32} />
          <div>
            <strong>Team Task Manager</strong>
            <span>{isSignup ? "Create your workspace account" : "Welcome back"}</span>
          </div>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Name
              <input name="name" value={form.name} onChange={updateField} minLength="2" required />
            </label>
          )}

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} required />
          </label>

          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={updateField} minLength="6" required />
          </label>

          {isSignup && (
            <label>
              Role
              <select name="role" value={form.role} onChange={updateField}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          )}

          {error && <div className="alert error">{error}</div>}

          <button className="primary-button" disabled={busy} type="submit">
            {busy ? "Please wait..." : isSignup ? "Create account" : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Login" : "Sign up"}</Link>
        </p>
      </section>
    </div>
  );
}
