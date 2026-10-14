const Route = require("../models/Route");


// CREATE ROUTE
const createRoute = async (req, res) => {
  try {
    const {
      origin,
      destination,
      distanceKm,
      estimatedDurationMinutes,
    } = req.body;

    if (
      !origin ||
      !destination ||
      !distanceKm ||
      !estimatedDurationMinutes
    ) {
      return res.status(400).json({
        message: "Please provide all required route details",
      });
    }

    if (
      origin.trim().toLowerCase() ===
      destination.trim().toLowerCase()
    ) {
      return res.status(400).json({
        message: "Origin and destination cannot be the same",
      });
    }

    const existingRoute = await Route.findOne({
      origin: origin.trim(),
      destination: destination.trim(),
    });

    if (existingRoute) {
      return res.status(400).json({
        message: "This route already exists",
      });
    }

    const route = await Route.create({
      origin: origin.trim(),
      destination: destination.trim(),
      distanceKm,
      estimatedDurationMinutes,
    });

    return res.status(201).json({
      message: "Route created successfully",
      route,
    });

  } catch (error) {
    console.error("Create route error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// GET ALL ROUTES
const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: routes.length,
      routes,
    });

  } catch (error) {
    console.error("Get routes error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// GET ONE ROUTE
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(
      req.params.id
    );

    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    return res.status(200).json({
      route,
    });

  } catch (error) {
    console.error("Get route error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// UPDATE ROUTE
const updateRoute = async (req, res) => {
  try {
    const route = await Route.findById(
      req.params.id
    );

    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    if (req.body.origin !== undefined) {
      route.origin = req.body.origin.trim();
    }

    if (req.body.destination !== undefined) {
      route.destination =
        req.body.destination.trim();
    }

    if (req.body.distanceKm !== undefined) {
      route.distanceKm = req.body.distanceKm;
    }

    if (
      req.body.estimatedDurationMinutes !== undefined
    ) {
      route.estimatedDurationMinutes =
        req.body.estimatedDurationMinutes;
    }

    if (req.body.status !== undefined) {
      route.status = req.body.status;
    }

    if (
      route.origin.toLowerCase() ===
      route.destination.toLowerCase()
    ) {
      return res.status(400).json({
        message: "Origin and destination cannot be the same",
      });
    }

    const updatedRoute = await route.save();

    return res.status(200).json({
      message: "Route updated successfully",
      route: updatedRoute,
    });

  } catch (error) {
    console.error("Update route error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// DELETE ROUTE
const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(
      req.params.id
    );

    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    return res.status(200).json({
      message: "Route deleted successfully",
    });

  } catch (error) {
    console.error("Delete route error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
};