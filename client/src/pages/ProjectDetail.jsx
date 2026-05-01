import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api.js";
import TaskStatus from "../components/TaskStatus.jsx";
import { useAuth } from "../state/AuthContext.jsx";

const emptyTask = {
  title: "",
  description: "",
  assignedTo: "",
  status: "todo",
  priority: "medium",
  dueDate: ""
};

function displayDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState("");

  const team = useMemo(() => {
    if (!project) return [];
    return [project.owner, ...project.members].filter(Boolean);
  }, [project]);

  async function loadProject() {
    const { data } = await api.get(`/projects/${id}`);
    setProject(data.project);
    setTasks(data.tasks);
    setForm((current) => ({ ...current, assignedTo: data.project.members[0]?._id || data.project.owner?._id || "" }));
  }

  useEffect(() => {
    loadProject().catch((err) => setError(err.response?.data?.message || "Could not load project"));
  }, [id]);

  async function createTask(event) {
    event.preventDefault();
    setError("");

    try {
      await api.post("/tasks", { ...form, project: id });
      setForm((current) => ({ ...emptyTask, assignedTo: current.assignedTo }));
      await loadProject();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create task");
    }
  }

  async function updateStatus(task, status) {
    const { data } = await api.patch(`/tasks/${task._id}`, { status });
    setTasks((current) => current.map((item) => (item._id === data._id ? data : item)));
  }

  if (error) return <div className="alert error">{error}</div>;
  if (!project) return <div className="screen-message">Loading project...</div>;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Project</span>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
      </header>

      {isAdmin && (
        <section className="panel">
          <h2>Create task</h2>
          <form className="project-form" onSubmit={createTask}>
            <label>
              Title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>
            <label>
              Assignee
              <select value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} required>
                {team.map((member) => (
                  <option value={member._id} key={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required />
            </label>
            <label className="full-span">
              Description
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <button className="primary-button" type="submit">
              <Plus size={17} />
              Add task
            </button>
          </form>
        </section>
      )}

      <section className="panel">
        <h2>Tasks</h2>
        <div className="task-board">
          {["todo", "in-progress", "review", "done"].map((status) => (
            <div className="task-column" key={status}>
              <TaskStatus status={status} />
              {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <article className="task-card" key={task._id}>
                    <strong>{task.title}</strong>
                    <p>{task.description || "No description."}</p>
                    <div className="project-meta">
                      <span>{task.assignedTo?.name}</span>
                      <span>{displayDate(task.dueDate)}</span>
                    </div>
                    <select value={task.status} onChange={(event) => updateStatus(task, event.target.value)}>
                      <option value="todo">To do</option>
                      <option value="in-progress">In progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </article>
                ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
