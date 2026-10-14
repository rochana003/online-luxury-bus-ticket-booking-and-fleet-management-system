const Bus = require("../models/Bus");


// CREATE BUS
const createBus = async (req, res) => {
  try {
    const {
      name,
      registrationNumber,
      model,
      type,
      totalSeats,
    } = req.body;

    if (
      !name ||
      !registrationNumber ||
      !model ||
      !type
    ) {
      return res.status(400).json({
        message: "Please provide all required bus details",
      });
    }

    const existingBus = await Bus.findOne({
      registrationNumber:
        registrationNumber.trim().toUpperCase(),
    });

    if (existingBus) {
      return res.status(400).json({
        message:
          "A bus with this registration number already exists",
      });
    }

    const bus = await Bus.create({
      name,
      registrationNumber,
      model,
      type,
      totalSeats: totalSeats || 51,
    });

    return res.status(201).json({
      message: "Bus created successfully",
      bus,
    });

  } catch (error) {
    console.error("Create bus error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// GET ALL BUSES
const getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      count: buses.length,
      buses,
    });

  } catch (error) {
    console.error("Get buses error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// GET ONE BUS
const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(
      req.params.id
    );

    if (!bus) {
      return res.status(404).json({
        message: "Bus not found",
      });
    }

    return res.status(200).json({
      bus,
    });

  } catch (error) {
    console.error("Get bus error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// UPDATE BUS
const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!bus) {
      return res.status(404).json({
        message: "Bus not found",
      });
    }

    return res.status(200).json({
      message: "Bus updated successfully",
      bus,
    });

  } catch (error) {
    console.error("Update bus error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// DELETE BUS
const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(
      req.params.id
    );

    if (!bus) {
      return res.status(404).json({
        message: "Bus not found",
      });
    }

    return res.status(200).json({
      message: "Bus deleted successfully",
    });

  } catch (error) {
    console.error("Delete bus error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus,
};