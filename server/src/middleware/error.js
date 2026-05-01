import { validationResult } from "express-validator";

export function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg
      }))
    });
  }

  next();
}

export function notFound(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(error, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (error.name === "CastError") {
    return res.status(404).json({ message: "Resource not found" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Duplicate value already exists" });
  }

  res.status(statusCode).json({
    message: error.message || "Server error"
  });
}
