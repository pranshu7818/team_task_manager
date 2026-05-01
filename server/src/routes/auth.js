import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/error.js";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";

const router = express.Router();

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["admin", "member"]).withMessage("Role must be admin or member")
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, role = "member" } = req.body;
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const user = await User.create({ name, email, password, role });

      res.status(201).json({
        user: userPayload(user),
        token: signToken(user)
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({
        user: userPayload(user),
        token: signToken(user)
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/me", protect, (req, res) => {
  res.json({ user: userPayload(req.user) });
});

export default router;
