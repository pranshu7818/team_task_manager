import express from "express";
import { protect } from "../middleware/auth.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const router = express.Router();

router.get("/", protect, async (req, res, next) => {
  try {
    const projectFilter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const taskFilter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
    const now = new Date();

    const [projectCount, totalTasks, statusCounts, overdueTasks, upcomingTasks] = await Promise.all([
      Project.countDocuments(projectFilter),
      Task.countDocuments(taskFilter),
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Task.find({ ...taskFilter, dueDate: { $lt: now }, status: { $ne: "done" } })
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .sort({ dueDate: 1 })
        .limit(6),
      Task.find({ ...taskFilter, dueDate: { $gte: now }, status: { $ne: "done" } })
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .sort({ dueDate: 1 })
        .limit(6)
    ]);

    const status = {
      todo: 0,
      "in-progress": 0,
      review: 0,
      done: 0
    };

    statusCounts.forEach((item) => {
      status[item._id] = item.count;
    });

    res.json({
      projectCount,
      totalTasks,
      status,
      overdueTasks,
      upcomingTasks
    });
  } catch (error) {
    next(error);
  }
});

export default router;
