const mongoose = require("mongoose");
const Route = require("../models/Route");
const Schedule = require("../models/Schedule");

// Helper to safely escape special characters for regex matching
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Create a new travel route
const createRoute = async (req, res) => {
  try {
    const { origin, destination, distanceKm, estimatedDurationMinutes, status } = req.body;

    if (!origin || !destination || !distanceKm) {
      return res.status(400).json({ message: "Please provide all required route details" });
    }

    const cleanOrigin = origin.trim();
    const cleanDestination = destination.trim();

    if (cleanOrigin.toLowerCase() === cleanDestination.toLowerCase()) {
      return res.status(400).json({ message: "Origin and destination cannot be the same" });
    }

    if (Number(distanceKm) <= 0) {
      return res.status(400).json({ message: "Distance must be greater than zero" });
    }

    if (estimatedDurationMinutes !== undefined && Number(estimatedDurationMinutes) <= 0) {
      return res.status(400).json({ message: "Estimated duration must be greater than zero" });
    }

    // Check for existing route between the same origin and destination
    const existingRoute = await Route.findOne({
      origin: { $regex: `^${escapeRegex(cleanOrigin)}$`, $options: "i" },
      destination: { $regex: `^${escapeRegex(cleanDestination)}$`, $options: "i" },
    });

    if (existingRoute) {
      return res.status(409).json({ message: "This route already exists" });
    }

    const route = await Route.create({
      origin: cleanOrigin,
      destination: cleanDestination,
      distanceKm: Number(distanceKm),
      ...(estimatedDurationMinutes ? { estimatedDurationMinutes: Number(estimatedDurationMinutes) } : {}),
      status: status || "active",
    });

    return res.status(201).json({
      message: "Route created successfully",
      route,
    });
  } catch (error) {
    console.error("Create route error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Retrieve all routes
const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    return res.status(200).json({
      count: routes.length,
      routes,
    });
  } catch (error) {
    console.error("Get routes error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Retrieve a single route by ID
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    return res.status(200).json({ route });
  } catch (error) {
    console.error("Get route error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update existing route details
const updateRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const { origin, destination, distanceKm, estimatedDurationMinutes, status } = req.body;

    const finalOrigin = origin !== undefined ? origin.trim() : route.origin;
    const finalDestination = destination !== undefined ? destination.trim() : route.destination;

    if (finalOrigin.toLowerCase() === finalDestination.toLowerCase()) {
      return res.status(400).json({ message: "Origin and destination cannot be the same" });
    }

    if (distanceKm !== undefined && Number(distanceKm) <= 0) {
      return res.status(400).json({ message: "Distance must be greater than zero" });
    }

    if (estimatedDurationMinutes !== undefined && Number(estimatedDurationMinutes) <= 0) {
      return res.status(400).json({ message: "Estimated duration must be greater than zero" });
    }

    // Ensure update does not conflict with another existing route
    const duplicateRoute = await Route.findOne({
      _id: { $ne: route._id },
      origin: { $regex: `^${escapeRegex(finalOrigin)}$`, $options: "i" },
      destination: { $regex: `^${escapeRegex(finalDestination)}$`, $options: "i" },
    });

    if (duplicateRoute) {
      return res.status(409).json({
        message: "Another route with this origin and destination already exists",
      });
    }

    route.origin = finalOrigin;
    route.destination = finalDestination;

    if (distanceKm !== undefined) {
      route.distanceKm = Number(distanceKm);
    }
    if (estimatedDurationMinutes !== undefined) {
      route.estimatedDurationMinutes = Number(estimatedDurationMinutes);
    }
    if (status !== undefined) {
      route.status = status;
    }

    await route.save();

    return res.status(200).json({
      message: "Route updated successfully",
      route,
    });
  } catch (error) {
    console.error("Update route error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a route (only allowed if not referenced by schedules)
const deleteRoute = async (req, res) => {
  try {
    const routeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const scheduleExists = await Schedule.exists({ route: routeId });
    if (scheduleExists) {
      return res.status(409).json({
        message: "Cannot delete this route because it is already used by one or more schedules. Set the route to inactive instead.",
      });
    }

    await Route.findByIdAndDelete(routeId);
    return res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    console.error("Delete route error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
};
