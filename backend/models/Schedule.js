const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },

    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },

    departureTime: {
      type: Date,
      required: true,
    },

    arrivalTime: {
      type: Date,
      required: true,
    },

    fare: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Schedule",
  scheduleSchema
);