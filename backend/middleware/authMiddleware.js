const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No Authorization header
    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Expected format:
    // Authorization: Bearer TOKEN
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid token format",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Save authenticated user information
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;