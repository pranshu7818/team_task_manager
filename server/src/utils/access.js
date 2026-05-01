import Project from "../models/Project.js";

export async function getAccessibleProject(projectId, user) {
  const project = await Project.findById(projectId);

  if (!project) {
    return null;
  }

  const isOwner = project.owner.equals(user._id);
  const isMember = project.members.some((memberId) => memberId.equals(user._id));

  if (user.role !== "admin" && !isOwner && !isMember) {
    return false;
  }

  return project;
}
