import { useEffect, useState } from "react";
import api from "../api.js";
import StatCard from "../components/StatCard.jsx";
import TaskStatus from "../components/TaskStatus.jsx";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data: dashboard }) => setData(dashboard))
      .catch((err) => setError(err.response?.data?.message || "Could not load dashboard"));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="screen-message">Loading dashboard...</div>;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Dashboard</h1>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Projects" value={data.projectCount} />
        <StatCard label="Total tasks" value={data.totalTasks} />
        <StatCard label="Overdue" value={data.overdueTasks.length} tone="danger" />
        <StatCard label="Completed" value={data.status.done} tone="success" />
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Status breakdown</h2>
          <div className="status-bars">
            {Object.entries(data.status).map(([status, count]) => (
              <div className="status-row" key={status}>
                <TaskStatus status={status} />
                <div className="bar">
                  <span style={{ width: `${data.totalTasks ? (count / data.totalTasks) * 100 : 0}%` }} />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Overdue tasks</h2>
          <div className="compact-list">
            {data.overdueTasks.length === 0 && <p className="muted">No overdue work.</p>}
            {data.overdueTasks.map((task) => (
              <article key={task._id}>
                <strong>{task.title}</strong>
                <span>{task.project?.name} by {formatDate(task.dueDate)}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Upcoming tasks</h2>
        <div className="table-list">
          {data.upcomingTasks.map((task) => (
            <article className="table-row" key={task._id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.project?.name}</span>
              </div>
              <TaskStatus status={task.status} />
              <span>{task.assignedTo?.name}</span>
              <span>{formatDate(task.dueDate)}</span>
            </article>
          ))}
          {data.upcomingTasks.length === 0 && <p className="muted">No upcoming tasks.</p>}
        </div>
      </section>
    </div>
  );
}
