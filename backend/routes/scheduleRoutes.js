const express = require("express");

const {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");

const protect = require(
  "../middleware/authMiddleware"
);

const adminOnly = require(
  "../middleware/adminMiddleware"
);

const router = express.Router();


// Public
router.get(
  "/",
  getSchedules
);

router.get(
  "/:id",
  getScheduleById
);


// Admin only
router.post(
  "/",
  protect,
  adminOnly,
  createSchedule
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updateSchedule
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteSchedule
);

module.exports = router;