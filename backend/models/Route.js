const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    origin: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    distanceKm: {
      type: Number,
      required: true,
      min: 1,
    },

    estimatedDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Route", routeSchema);