import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => {
        if ("param" in err) {
          return { field: err.param, message: err.msg };
        }
        return { message: err.msg };
      }),
    });
  }
  next();
};
