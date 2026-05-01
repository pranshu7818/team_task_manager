import express from "express";
import mongoose from "mongoose";
import { body, param } from "express-validator";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/error.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { getAccessibleProject } from "../utils/access.js";

const router = express.Router();

const projectValidators = [
  body("name").trim().isLength({ min: 3 }).withMessage("Project name must be at least 3 characters"),
  body("description").optional().trim().isLength({ max: 1000 }).withMessage("Description is too long"),
  body("members").optional().isArray().withMessage("Members must be an array"),
  body("members.*").optional().isMongoId().withMessage("Member id is invalid"),
  body("dueDate").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Due date must be valid")
];

const idValidator = [param("id").isMongoId().withMessage("Invalid project id")];

router.get("/", protect, async (req, res, next) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(filter)
      .populate("owner", "name email role")
      .populate("members", "name email role")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post("/", protect, authorize("admin"), projectValidators, validate, async (req, res, next) => {
  try {
    const { name, description = "", members = [], dueDate } = req.body;
    const uniqueMembers = [...new Set(members)];

    const memberCount = await User.countDocuments({ _id: { $in: uniqueMembers } });
    if (memberCount !== uniqueMembers.length) {
      return res.status(400).json({ message: "One or more selected members do not exist" });
    }

    const project = await Project.create({
      name,
      description,
      members: uniqueMembers,
      dueDate: dueDate || undefined,
      owner: req.user._id
    });

    const populatedProject = await project.populate([
      { path: "owner", select: "name email role" },
      { path: "members", select: "name email role" }
    ]);

    res.status(201).json(populatedProject);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", protect, idValidator, validate, async (req, res, next) => {
  try {
    const project = await getAccessibleProject(req.params.id, req.user);

    if (project === null) return res.status(404).json({ message: "Project not found" });
    if (project === false) return res.status(403).json({ message: "Project access denied" });

    await project.populate([
      { path: "owner", select: "name email role" },
      { path: "members", select: "name email role" }
    ]);

    const tasks = await Task.find({ project: project._id })
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ dueDate: 1 });

    res.json({ project, tasks });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", protect, authorize("admin"), idValidator, projectValidators, validate, async (req, res, next) => {
  try {
    const { name, description = "", members = [], dueDate } = req.body;
    const uniqueMembers = [...new Set(members)];

    const memberCount = await User.countDocuments({ _id: { $in: uniqueMembers } });
    if (memberCount !== uniqueMembers.length) {
      return res.status(400).json({ message: "One or more selected members do not exist" });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        members: uniqueMembers.map((id) => new mongoose.Types.ObjectId(id)),
        dueDate: dueDate || null
      },
      { new: true, runValidators: true }
    )
      .populate("owner", "name email role")
      .populate("members", "name email role");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", protect, authorize("admin"), idValidator, validate, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: "Project deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
