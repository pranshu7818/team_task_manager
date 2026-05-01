import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../state/AuthContext.jsx";

const emptyProject = {
  name: "",
  description: "",
  dueDate: "",
  members: []
};

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyProject);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const members = useMemo(() => users.filter((user) => user.role === "member"), [users]);

  async function loadProjects() {
    const { data } = await api.get("/projects");
    setProjects(data);
  }

  useEffect(() => {
    loadProjects().catch((err) => setError(err.response?.data?.message || "Could not load projects"));
    if (isAdmin) {
      api.get("/users").then(({ data }) => setUsers(data));
    }
  }, [isAdmin]);

  function toggleMember(id) {
    setForm((current) => ({
      ...current,
      members: current.members.includes(id)
        ? current.members.filter((memberId) => memberId !== id)
        : [...current.members, id]
    }));
  }

  async function createProject(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await api.post("/projects", form);
      setForm(emptyProject);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create project");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject(id) {
    await api.delete(`/projects/${id}`);
    setProjects((current) => current.filter((project) => project._id !== id));
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1>Projects</h1>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      {isAdmin && (
        <section className="panel">
          <h2>Create project</h2>
          <form className="project-form" onSubmit={createProject}>
            <label>
              Project name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Due date
              <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </label>
            <label className="full-span">
              Description
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <div className="full-span">
              <span className="field-title">Members</span>
              <div className="check-grid">
                {members.map((member) => (
                  <label key={member._id} className="check-item">
                    <input type="checkbox" checked={form.members.includes(member._id)} onChange={() => toggleMember(member._id)} />
                    {member.name}
                  </label>
                ))}
              </div>
            </div>
            <button className="primary-button" disabled={busy} type="submit">
              <Plus size={17} />
              Add project
            </button>
          </form>
        </section>
      )}

      <section className="project-grid">
        {projects.map((project) => (
          <article className="project-card" key={project._id}>
            <div>
              <h2>
                <Link to={`/projects/${project._id}`}>{project.name}</Link>
              </h2>
              <p>{project.description || "No description provided."}</p>
            </div>
            <div className="project-meta">
              <span>{project.members.length} members</span>
              <span>Owner: {project.owner?.name}</span>
            </div>
            {isAdmin && (
              <button className="icon-button danger" title="Delete project" onClick={() => deleteProject(project._id)} type="button">
                <Trash2 size={17} />
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
