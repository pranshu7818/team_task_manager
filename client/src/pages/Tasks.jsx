import { useEffect, useState } from "react";
import api from "../api.js";
import TaskStatus from "../components/TaskStatus.jsx";

function displayDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/tasks")
      .then(({ data }) => setTasks(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load tasks"));
  }, []);

  async function updateStatus(task, status) {
    const { data } = await api.patch(`/tasks/${task._id}`, { status });
    setTasks((current) => current.map((item) => (item._id === data._id ? data : item)));
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Work queue</span>
          <h1>Tasks</h1>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <section className="panel">
        <div className="table-list">
          {tasks.map((task) => (
            <article className="table-row" key={task._id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.project?.name}</span>
              </div>
              <TaskStatus status={task.status} />
              <span>{task.assignedTo?.name}</span>
              <span>{displayDate(task.dueDate)}</span>
              <select value={task.status} onChange={(event) => updateStatus(task, event.target.value)}>
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </article>
          ))}
          {tasks.length === 0 && <p className="muted">No tasks yet.</p>}
        </div>
      </section>
    </div>
  );
}
