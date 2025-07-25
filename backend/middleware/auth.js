const jwt = require("jsonwebtoken");

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorizeRoles = (role) => {
  return (req, res, next) => {
    if (!role.includes(req.userRole)) {
      return res
        .status(403)
        .json({ error: `Access restricted to role ${role}` });
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles };
