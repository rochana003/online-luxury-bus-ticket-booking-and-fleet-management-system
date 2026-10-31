const express = require("express");
const {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
} = require("../controllers/routeController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", getRoutes);
router.get("/:id", getRouteById);

router.post("/", protect, adminOnly, createRoute);
router.put("/:id", protect, adminOnly, updateRoute);
router.delete("/:id", protect, adminOnly, deleteRoute);

module.exports = router;
