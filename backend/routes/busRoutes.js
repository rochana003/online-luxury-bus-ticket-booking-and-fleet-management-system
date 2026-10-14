const express = require("express");

const {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
} = require("../controllers/busController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();


// Public routes
router.get("/", getBuses);

router.get("/:id", getBusById);


// Admin routes
router.post(
  "/",
  protect,
  adminOnly,
  createBus
);

router.put(
  "/:id",
  protect,
  adminOnly,
  updateBus
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteBus
);

module.exports = router;