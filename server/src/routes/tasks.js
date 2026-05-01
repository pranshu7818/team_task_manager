import express from "express";
import { body, param } from "express-validator";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/error.js";
import Task from "../models/Task.js";
import { getAccessibleProject } from "../utils/access.js";

const router = express.Router();

const taskValidators = [
  body("title").trim().isLength({ min: 3 }).withMessage("Task title must be at least 3 characters"),
  body("description").optional().trim().isLength({ max: 1200 }).withMessage("Description is too long"),
  body("project").isMongoId().withMessage("Project is required"),
  body("assignedTo").isMongoId().withMessage("Assignee is required"),
  body("status").optional().isIn(["todo", "in-progress", "review", "done"]).withMessage("Invalid status"),
  body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
  body("dueDate").isISO8601().withMessage("Due date must be valid")
];

const taskPatchValidators = [
  body("title").optional().trim().isLength({ min: 3 }).withMessage("Task title must be at least 3 characters"),
  body("description").optional().trim().isLength({ max: 1200 }).withMessage("Description is too long"),
  body("project").optional().isMongoId().withMessage("Project is required"),
  body("assignedTo").optional().isMongoId().withMessage("Assignee is required"),
  body("status").optional().isIn(["todo", "in-progress", "review", "done"]).withMessage("Invalid status"),
  body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
  body("dueDate").optional().isISO8601().withMessage("Due date must be valid")
];

router.get("/", protect, async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };

    const tasks = await Task.find(filter)
      .populate("project", "name dueDate")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post("/", protect, authorize("admin"), taskValidators, validate, async (req, res, next) => {
  try {
    const { title, description = "", project: projectId, assignedTo, status = "todo", priority = "medium", dueDate } = req.body;
    const project = await getAccessibleProject(projectId, req.user);

    if (project === null) return res.status(404).json({ message: "Project not found" });
    if (project === false) return res.status(403).json({ message: "Project access denied" });

    const allowedAssignees = [project.owner.toString(), ...project.members.map((member) => member.toString())];
    if (!allowedAssignees.includes(assignedTo)) {
      return res.status(400).json({ message: "Assignee must belong to the project team" });
    }

    const task = await Task.create({
      title,
      description,
      project: project._id,
      assignedTo,
      status,
      priority,
      dueDate,
      createdBy: req.user._id
    });

    const populatedTask = await task.populate([
      { path: "project", select: "name dueDate" },
      { path: "assignedTo", select: "name email role" },
      { path: "createdBy", select: "name email role" }
    ]);

    res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id",
  protect,
  [param("id").isMongoId().withMessage("Invalid task id"), ...taskPatchValidators],
  validate,
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const isAssignee = task.assignedTo.equals(req.user._id);
      if (req.user.role !== "admin" && !isAssignee) {
        return res.status(403).json({ message: "Task access denied" });
      }

      const allowedMemberFields = ["status"];
      const updates = req.body;

      if (req.user.role !== "admin") {
        const invalidFields = Object.keys(updates).filter((field) => !allowedMemberFields.includes(field));
        if (invalidFields.length) {
          return res.status(403).json({ message: "Members can only update task status" });
        }
      }

      if (updates.project || updates.assignedTo) {
        const project = await getAccessibleProject(updates.project || task.project, req.user);
        if (project === null) return res.status(404).json({ message: "Project not found" });
        if (project === false) return res.status(403).json({ message: "Project access denied" });

        const assignedTo = updates.assignedTo || task.assignedTo.toString();
        const allowedAssignees = [project.owner.toString(), ...project.members.map((member) => member.toString())];
        if (!allowedAssignees.includes(assignedTo)) {
          return res.status(400).json({ message: "Assignee must belong to the project team" });
        }
      }

      Object.assign(task, updates);
      await task.save();
      await task.populate([
        { path: "project", select: "name dueDate" },
        { path: "assignedTo", select: "name email role" },
        { path: "createdBy", select: "name email role" }
      ]);

      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", protect, authorize("admin"), [param("id").isMongoId().withMessage("Invalid task id")], validate, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
