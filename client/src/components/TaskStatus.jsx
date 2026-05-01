const labels = {
  todo: "To do",
  "in-progress": "In progress",
  review: "Review",
  done: "Done"
};

export default function TaskStatus({ status }) {
  return <span className={`status-pill status-${status}`}>{labels[status] || status}</span>;
}
