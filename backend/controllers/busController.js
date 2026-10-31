const mongoose = require("mongoose");
const Bus = require("../models/Bus");
const Schedule = require("../models/Schedule");
const Booking = require("../models/Booking");

// Create a new bus entry in fleet
const createBus = async (req, res) => {
  try {
    const { name, registrationNumber, model, type, totalSeats } = req.body;

    if (!registrationNumber || !model || !type) {
      return res.status(400).json({ message: "Please provide all required bus details" });
    }

    const existingBus = await Bus.findOne({
      registrationNumber: registrationNumber.trim().toUpperCase(),
    });

    if (existingBus) {
      return res.status(400).json({
        message: "A bus with this registration number already exists",
      });
    }

    const bus = await Bus.create({
      ...(name ? { name: name.trim() } : {}),
      registrationNumber: registrationNumber.trim().toUpperCase(),
      model: model.trim(),
      type: type.trim(),
      totalSeats: totalSeats || 51,
    });

    return res.status(201).json({
      message: "Bus created successfully",
      bus,
    });
  } catch (error) {
    console.error("Create bus error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Retrieve all buses in the fleet
const getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    return res.status(200).json({
      count: buses.length,
      buses,
    });
  } catch (error) {
    console.error("Get buses error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Retrieve a single bus by ID
const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    return res.status(200).json({ bus });
  } catch (error) {
    console.error("Get bus error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update bus details
const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const oldTotalSeats = bus.totalSeats;
    const newTotalSeats = req.body.totalSeats !== undefined ? Number(req.body.totalSeats) : oldTotalSeats;

    // Prevent changing total seat capacity if bookings already exist on any schedule for this bus
    if (req.body.totalSeats !== undefined && newTotalSeats !== oldTotalSeats) {
      const schedules = await Schedule.find({ bus: bus._id }).select("_id");
      const scheduleIds = schedules.map((s) => s._id);

      if (scheduleIds.length > 0) {
        const bookingExists = await Booking.exists({
          schedule: { $in: scheduleIds },
        });

        if (bookingExists) {
          return res.status(409).json({
            message: "Total seats cannot be changed because this bus already has passenger bookings.",
          });
        }
      }
    }

    Object.assign(bus, req.body);
    await bus.save();

    return res.status(200).json({
      message: "Bus updated successfully",
      bus,
    });
  } catch (error) {
    console.error("Update bus error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A bus with this registration number already exists",
      });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a bus from fleet (only allowed if not assigned to schedules)
const deleteBus = async (req, res) => {
  try {
    const busId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(busId)) {
      return res.status(400).json({ message: "Invalid bus ID" });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const scheduleExists = await Schedule.exists({ bus: busId });
    if (scheduleExists) {
      return res.status(409).json({
        message: "Cannot delete this bus because it is already used by one or more schedules. Set the bus to inactive instead.",
      });
    }

    await Bus.findByIdAndDelete(busId);
    return res.status(200).json({ message: "Bus deleted successfully" });
  } catch (error) {
    console.error("Delete bus error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
};
