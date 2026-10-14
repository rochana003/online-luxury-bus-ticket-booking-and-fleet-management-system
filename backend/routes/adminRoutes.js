const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { getAdminProfile } = require("../controllers/adminController");

const router = express.Router();

//admin test route
router.get(
  "/test",
  protect,
  adminOnly,
  (req, res) => {
    res.status(200).json({
      message: "Admin access successful",
      user: req.user,
    });
  }
);

// Admin profile
router.get(
  "/profile",
  protect,
  adminOnly,
  getAdminProfile
);

module.exports = router;