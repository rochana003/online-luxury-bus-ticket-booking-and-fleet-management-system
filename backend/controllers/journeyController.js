const Route = require("../models/Route");
const Schedule = require("../models/Schedule");
const Booking = require("../models/Booking");

// Helper to escape regex special characters
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Search available journeys based on origin, destination and date
const searchJourneys = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({ message: "Please provide from, to and date" });
    }

    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (cleanFrom.toLowerCase() === cleanTo.toLowerCase()) {
      return res.status(400).json({ message: "Origin and destination cannot be the same" });
    }

    // Find active route matching origin and destination
    const routes = await Route.find({
      origin: { $regex: `^${escapeRegex(cleanFrom)}$`, $options: "i" },
      destination: { $regex: `^${escapeRegex(cleanTo)}$`, $options: "i" },
      status: "active",
    });

    if (routes.length === 0) {
      return res.status(200).json({
        count: 0,
        journeys: [],
        message: "No route found for the selected journey",
      });
    }

    const routeIds = routes.map((r) => r._id);

    // Parse date window in Sri Lanka time (UTC+05:30)
    const startDate = new Date(`${date}T00:00:00+05:30`);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Invalid travel date" });
    }

    const now = new Date();
    const sriLankaTodayString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const todayStart = new Date(`${sriLankaTodayString}T00:00:00+05:30`);
    if (startDate < todayStart) {
      return res.status(400).json({ message: "Travel date cannot be in the past" });
    }

    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    // Query scheduled journeys within selected date
    const schedules = await Schedule.find({
      route: { $in: routeIds },
      departureTime: { $gte: startDate, $lt: endDate },
      status: "scheduled",
    })
      .populate("bus", "name registrationNumber model type totalSeats status")
      .populate("route", "origin destination distanceKm estimatedDurationMinutes")
      .sort({ departureTime: 1 });

    const activeSchedules = schedules.filter(
      (s) => s.bus && s.bus.status === "active" && s.route
    );

    const scheduleIds = activeSchedules.map((s) => s._id);

    // Aggregate booked seats count per schedule
    const bookedSeatCounts = await Booking.aggregate([
      {
        $match: {
          schedule: { $in: scheduleIds },
          status: "confirmed",
        },
      },
      {
        $project: {
          schedule: 1,
          seatCount: { $size: "$seats" },
        },
      },
      {
        $group: {
          _id: "$schedule",
          bookedSeats: { $sum: "$seatCount" },
        },
      },
    ]);

    const bookedSeatsMap = {};
    bookedSeatCounts.forEach((item) => {
      bookedSeatsMap[item._id.toString()] = item.bookedSeats;
    });

    const journeys = activeSchedules.map((schedule) => {
      const booked = bookedSeatsMap[schedule._id.toString()] || 0;
      const totalSeats = schedule.bus.totalSeats || 51;
      const availableSeats = Math.max(totalSeats - booked, 0);

      return {
        id: schedule._id,
        bus: {
          id: schedule.bus._id,
          name: schedule.bus.name || schedule.bus.model || "Luxury Coach",
          registrationNumber: schedule.bus.registrationNumber,
          model: schedule.bus.model,
          type: schedule.bus.type,
          totalSeats: schedule.bus.totalSeats,
        },
        route: {
          id: schedule.route._id,
          origin: schedule.route.origin,
          destination: schedule.route.destination,
          distanceKm: schedule.route.distanceKm,
          estimatedDurationMinutes: schedule.route.estimatedDurationMinutes,
        },
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        fare: schedule.fare,
        availableSeats,
      };
    });

    return res.status(200).json({
      count: journeys.length,
      journeys,
    });
  } catch (error) {
    console.error("Journey search error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  searchJourneys,
};
