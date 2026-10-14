const Route = require("../models/Route");
const Schedule = require("../models/Schedule");
const Booking = require("../models/Booking");


// Helper to safely use user text in a regular expression
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


// SEARCH JOURNEYS
const searchJourneys = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    // Check required search values
    if (!from || !to || !date) {
      return res.status(400).json({
        message:
          "Please provide from, to and date",
      });
    }

    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (
      cleanFrom.toLowerCase() ===
      cleanTo.toLowerCase()
    ) {
      return res.status(400).json({
        message:
          "Origin and destination cannot be the same",
      });
    }

    // Find matching route
    const routes = await Route.find({
      origin: {
        $regex: `^${escapeRegex(cleanFrom)}$`,
        $options: "i",
      },

      destination: {
        $regex: `^${escapeRegex(cleanTo)}$`,
        $options: "i",
      },

      status: "active",
    });

    if (routes.length === 0) {
      return res.status(200).json({
        count: 0,
        journeys: [],
        message:
          "No route found for the selected journey",
      });
    }

    const routeIds = routes.map(
      (route) => route._id
    );

    // Sri Lanka local day
    const startDate = new Date(
      `${date}T00:00:00+05:30`
    );

    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: "Invalid travel date",
      });
    }

    // Next day
    const endDate = new Date(
      startDate.getTime() +
        24 * 60 * 60 * 1000
    );

    // Find schedules matching route + date
    const schedules = await Schedule.find({
      route: {
        $in: routeIds,
      },

      departureTime: {
        $gte: startDate,
        $lt: endDate,
      },

      status: "scheduled",
    })
      .populate(
        "bus",
        "name registrationNumber model type totalSeats status"
      )
      .populate(
        "route",
        "origin destination distanceKm estimatedDurationMinutes"
      )
      .sort({
        departureTime: 1,
      });

    // Remove schedules where the bus is inactive
    const activeSchedules =
      schedules.filter(
        (schedule) =>
          schedule.bus &&
          schedule.bus.status === "active"
      );

    
    const scheduleIds =
      activeSchedules.map(
        (schedule) =>
          schedule._id
      );
    
    // Get booked seat counts for each schedule
    const bookedSeatCounts =
      await Booking.aggregate([
        {
          $match: {
            schedule: {
              $in: scheduleIds,
            },

            status: "confirmed",
          },
        },

        {
          $project: {
            schedule: 1,

            seatCount: {
              $size: "$seats",
            },
          },
        },

        {
          $group: {
            _id: "$schedule",

            bookedSeats: {
              $sum: "$seatCount",
            },
          },
        },
      ]);

    const bookedSeatsMap = {};

    bookedSeatCounts.forEach(
      (item) => {
        bookedSeatsMap[item._id.toString()] = item.bookedSeats;
      }
    );

    // Format response
    const journeys = activeSchedules.map(
      (schedule) => ({
        id: schedule._id,

        bus: {
          id: schedule.bus._id,
          name: schedule.bus.name,
          registrationNumber:
            schedule.bus.registrationNumber,
          model: schedule.bus.model,
          type: schedule.bus.type,
          totalSeats: schedule.bus.totalSeats,
        },

        route: {
          id: schedule.route._id,
          origin: schedule.route.origin,
          destination:
            schedule.route.destination,
          distanceKm:
            schedule.route.distanceKm,
          estimatedDurationMinutes:
            schedule.route
              .estimatedDurationMinutes,
        },

        departureTime:
          schedule.departureTime,

        arrivalTime:
          schedule.arrivalTime,

        fare: schedule.fare,

        // Temporary until booking logic is added
        availableSeats:
          schedule.bus.totalSeats,
      })
    );

    return res.status(200).json({
      count: journeys.length,
      journeys,
    });

  } catch (error) {
    console.error(
      "Journey search error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  searchJourneys,
};