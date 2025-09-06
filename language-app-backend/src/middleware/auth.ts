import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface TokenPayload extends JwtPayload {
  userId: string;
  role: string;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ error: "Expired token", needsRefresh: true });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res
        .status(403)
        .json({ error: `Access restricted to role ${roles}` });
    }
    next();
  };
};
