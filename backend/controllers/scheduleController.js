const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Schedule = require("../models/Schedule");
const Bus = require("../models/Bus");
const Route = require("../models/Route");

// Create a new journey schedule (supports everyday daily recurring schedules and single special instances)
const createSchedule = async (req, res) => {
  try {
    const {
      busId,
      routeId,
      fare,
      // Single schedule fields:
      departureTime,
      arrivalTime,
      // Daily recurring schedule fields:
      isDaily,
      recurrenceType,
      departureTimeOfDay,
      arrivalTimeOfDay,
      startDate,
      endDate,
      daysOfWeek,
      timezoneOffset,
    } = req.body;

    if (!busId || !routeId || fare === undefined) {
      return res.status(400).json({ message: "Please provide bus, route, and fare" });
    }

    if (!mongoose.Types.ObjectId.isValid(busId) || !mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ message: "Invalid bus or route ID" });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    if (bus.status !== "active") {
      return res.status(400).json({ message: "Bus is not active" });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    if (route.status !== "active") {
      return res.status(400).json({ message: "Route is not active" });
    }

    if (Number(fare) < 0) {
      return res.status(400).json({ message: "Fare cannot be negative" });
    }

    const isRecurringDaily = Boolean(
      isDaily ||
      recurrenceType === "daily" ||
      (departureTimeOfDay && arrivalTimeOfDay && startDate && endDate)
    );

    // DAILY RECURRING SCHEDULE CREATION (DEFAULT)
    if (isRecurringDaily) {
      if (!departureTimeOfDay || !arrivalTimeOfDay || !startDate || !endDate) {
        return res.status(400).json({
          message: "Please provide departure time, arrival time, start date and end date for daily schedule",
        });
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(departureTimeOfDay) || !timeRegex.test(arrivalTimeOfDay)) {
        return res.status(400).json({ message: "Invalid time format. Please use HH:mm (e.g. 08:30)" });
      }

      if (departureTimeOfDay === arrivalTimeOfDay) {
        return res.status(400).json({ message: "Arrival time cannot be equal to departure time" });
      }

      const activeDays = Array.isArray(daysOfWeek) && daysOfWeek.length > 0
        ? daysOfWeek.map(Number)
        : [0, 1, 2, 3, 4, 5, 6];

      const start = new Date(`${startDate}T12:00:00Z`);
      const end = new Date(`${endDate}T12:00:00Z`);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid start or end date" });
      }

      if (end < start) {
        return res.status(400).json({ message: "End date must be on or after start date" });
      }

      const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
      if (diffDays > 180) {
        return res.status(400).json({ message: "Schedule generation range cannot exceed 180 days" });
      }

      const offset = timezoneOffset || "+05:30";
      const now = new Date();
      const schedulesToInsert = [];
      let skippedConflicts = 0;
      let skippedPast = 0;

      let current = new Date(start);
      while (current <= end) {
        const year = current.getUTCFullYear();
        const month = String(current.getUTCMonth() + 1).padStart(2, "0");
        const day = String(current.getUTCDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        const dayOfWeek = current.getUTCDay();

        if (activeDays.includes(dayOfWeek)) {
          const depDate = new Date(`${dateStr}T${departureTimeOfDay}:00${offset}`);
          let arrDate = new Date(`${dateStr}T${arrivalTimeOfDay}:00${offset}`);
          if (arrDate <= depDate) {
            arrDate = new Date(arrDate.getTime() + 24 * 60 * 60 * 1000);
          }

          if (depDate <= now) {
            skippedPast++;
          } else {
            const conflict = await Schedule.findOne({
              bus: busId,
              status: { $ne: "cancelled" },
              departureTime: { $lt: arrDate },
              arrivalTime: { $gt: depDate },
            });

            if (conflict) {
              skippedConflicts++;
            } else {
              schedulesToInsert.push({
                bus: busId,
                route: routeId,
                departureTime: depDate,
                arrivalTime: arrDate,
                fare: Number(fare),
                status: "scheduled",
              });
            }
          }
        }

        current.setUTCDate(current.getUTCDate() + 1);
      }

      if (schedulesToInsert.length === 0) {
        if (skippedConflicts > 0) {
          return res.status(409).json({
            message: `Could not create schedules: all ${skippedConflicts} matching dates conflict with existing schedules for this bus.`,
          });
        }
        return res.status(400).json({
          message: "No upcoming schedule dates found in the selected range (selected departure times may already be in the past).",
        });
      }

      const createdSchedules = await Schedule.insertMany(schedulesToInsert);

      let successMessage = `Successfully created ${createdSchedules.length} daily schedule${createdSchedules.length > 1 ? "s" : ""}.`;
      if (skippedConflicts > 0) {
        successMessage += ` (${skippedConflicts} day${skippedConflicts > 1 ? "s were" : " was"} skipped due to existing schedule conflicts)`;
      }

      return res.status(201).json({
        message: successMessage,
        count: createdSchedules.length,
        skippedConflicts,
        skippedPast,
      });
    }

    // SINGLE SCHEDULE (SPECIAL INSTANCE)
    if (!departureTime || !arrivalTime) {
      return res.status(400).json({ message: "Please provide departure and arrival times" });
    }

    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);

    if (departure <= new Date()) {
      return res.status(400).json({ message: "Departure time must be in the future" });
    }

    if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
      return res.status(400).json({ message: "Invalid departure or arrival time" });
    }

    if (arrival <= departure) {
      return res.status(400).json({ message: "Arrival time must be after departure time" });
    }

    // Check for conflicting schedules on the same bus during this timeframe
    const conflictingSchedule = await Schedule.findOne({
      bus: busId,
      status: { $ne: "cancelled" },
      departureTime: { $lt: arrival },
      arrivalTime: { $gt: departure },
    });

    if (conflictingSchedule) {
      return res.status(409).json({
        message: "This bus already has another schedule during this time",
      });
    }

    const schedule = await Schedule.create({
      bus: busId,
      route: routeId,
      departureTime: departure,
      arrivalTime: arrival,
      fare: Number(fare),
      status: "scheduled",
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate("bus", "name registrationNumber model type totalSeats status")
      .populate("route", "origin destination distanceKm estimatedDurationMinutes status");

    return res.status(201).json({
      message: "Schedule created successfully",
      schedule: populatedSchedule,
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Retrieve all schedules
const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate("bus", "name registrationNumber model type totalSeats status")
      .populate("route", "origin destination distanceKm estimatedDurationMinutes status")
      .sort({ departureTime: 1 });

    return res.status(200).json({
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Retrieve a single schedule by ID
const getScheduleById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findById(req.params.id)
      .populate("bus", "name registrationNumber model type totalSeats status")
      .populate("route", "origin destination distanceKm estimatedDurationMinutes status");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json({ schedule });
  } catch (error) {
    console.error("Get schedule error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update an existing schedule
const updateSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { busId, routeId, departureTime, arrivalTime, fare, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Do not allow reactivating a cancelled schedule
    if (schedule.status === "cancelled" && status && status !== "cancelled") {
      return res.status(400).json({
        message: "A cancelled schedule cannot be reactivated. Create a new schedule instead.",
      });
    }

    const finalBusId = busId || schedule.bus;
    const finalRouteId = routeId || schedule.route;
    const finalDepartureTime = departureTime ? new Date(departureTime) : new Date(schedule.departureTime);
    const finalArrivalTime = arrivalTime ? new Date(arrivalTime) : new Date(schedule.arrivalTime);
    const finalStatus = status || schedule.status;

    if (!mongoose.Types.ObjectId.isValid(finalBusId)) {
      return res.status(400).json({ message: "Invalid bus ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(finalRouteId)) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    if (Number.isNaN(finalDepartureTime.getTime()) || Number.isNaN(finalArrivalTime.getTime())) {
      return res.status(400).json({ message: "Invalid departure or arrival time" });
    }

    if (finalArrivalTime <= finalDepartureTime) {
      return res.status(400).json({ message: "Arrival time must be after departure time" });
    }

    if (fare !== undefined && Number(fare) < 0) {
      return res.status(400).json({ message: "Fare cannot be negative" });
    }

    const bus = await Bus.findById(finalBusId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    if (finalStatus === "scheduled" && bus.status !== "active") {
      return res.status(400).json({
        message: "Cannot use an inactive bus for a scheduled journey",
      });
    }

    const route = await Route.findById(finalRouteId);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (finalStatus === "scheduled" && route.status !== "active") {
      return res.status(400).json({
        message: "Cannot use an inactive route for a scheduled journey",
      });
    }

    if (finalStatus === "scheduled" && finalDepartureTime <= new Date()) {
      return res.status(400).json({
        message: "A scheduled journey must have a future departure time",
      });
    }

    // Check bus schedule conflicts when status is scheduled
    if (finalStatus === "scheduled") {
      const conflictingSchedule = await Schedule.findOne({
        _id: { $ne: schedule._id },
        bus: finalBusId,
        status: { $ne: "cancelled" },
        departureTime: { $lt: finalArrivalTime },
        arrivalTime: { $gt: finalDepartureTime },
      });

      if (conflictingSchedule) {
        return res.status(409).json({
          message: "This bus already has another schedule during the selected time.",
        });
      }
    }

    schedule.bus = finalBusId;
    schedule.route = finalRouteId;
    schedule.departureTime = finalDepartureTime;
    schedule.arrivalTime = finalArrivalTime;

    if (fare !== undefined) {
      schedule.fare = Number(fare);
    }

    const wasCancelled = schedule.status === "cancelled";
    if (status !== undefined) {
      schedule.status = status;
    }

    await schedule.save();

    // If schedule is cancelled by admin, automatically cancel all related active bookings
    if (!wasCancelled && schedule.status === "cancelled") {
      await Booking.updateMany(
        { schedule: schedule._id, status: "confirmed" },
        {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
          },
        }
      );
    }

    const updatedSchedule = await Schedule.findById(schedule._id)
      .populate("bus", "name registrationNumber model type totalSeats status")
      .populate("route", "origin destination distanceKm estimatedDurationMinutes status");

    return res.status(200).json({
      message: "Schedule updated successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete schedule (only if no passenger bookings exist)
const deleteSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid schedule ID" });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const bookingExists = await Booking.exists({ schedule: scheduleId });
    if (bookingExists) {
      return res.status(409).json({
        message: "Cannot delete this schedule because passenger bookings already exist. Cancel the schedule instead.",
      });
    }

    await Schedule.findByIdAndDelete(scheduleId);
    return res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
};
