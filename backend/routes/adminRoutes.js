const express = require("express");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { getAdminProfile } = require("../controllers/adminController");

const router = express.Router();

router.get("/test", protect, adminOnly, (req, res) => {
  res.status(200).json({
    message: "Admin access successful",
    user: req.user,
  });
});

router.get("/profile", protect, adminOnly, getAdminProfile);

module.exports = router;
