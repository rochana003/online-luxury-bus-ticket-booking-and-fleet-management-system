const mongoose = require("mongoose");
const crypto = require("crypto");

const Booking = require(
  "../models/Booking"
);

const Schedule = require(
  "../models/Schedule"
);


// Generate booking reference
function generateBookingReference() {
  const randomPart = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  const timePart = Date.now()
    .toString(36)
    .toUpperCase();

  return `LB-${timePart}-${randomPart}`;
}


// CREATE BOOKING
const createBooking = async (
  req,
  res
) => {
  try {
    const {
      scheduleId,
      seats,
    } = req.body;


    // Basic validation
    if (
      !scheduleId ||
      !Array.isArray(seats) ||
      seats.length === 0
    ) {
      return res.status(400).json({
        message:
          "Schedule and at least one seat are required",
      });
    }


    if (
      !mongoose.Types.ObjectId.isValid(
        scheduleId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid schedule ID",
      });
    }


    // Remove duplicate seat numbers
    const uniqueSeats = [
      ...new Set(
        seats.map(Number)
      ),
    ];


    if (
      uniqueSeats.length !==
      seats.length
    ) {
      return res.status(400).json({
        message:
          "Duplicate seat numbers are not allowed",
      });
    }


    // Get schedule + bus + route
    const schedule =
      await Schedule.findById(
        scheduleId
      )
        .populate("bus")
        .populate("route");


    if (!schedule) {
      return res.status(404).json({
        message:
          "Schedule not found",
      });
    }


    if (
      schedule.status !==
      "scheduled"
    ) {
      return res.status(400).json({
        message:
          "This schedule is not available for booking",
      });
    }


    if (
      !schedule.bus ||
      schedule.bus.status !==
        "active"
    ) {
      return res.status(400).json({
        message:
          "This bus is not currently available",
      });
    }


    // Do not allow booking after departure
    if (
      new Date(
        schedule.departureTime
      ) <= new Date()
    ) {
      return res.status(400).json({
        message:
          "This journey has already departed",
      });
    }


    // Validate every seat
    const invalidSeat =
      uniqueSeats.find(
        (seat) =>
          !Number.isInteger(seat) ||
          seat < 1 ||
          seat >
            schedule.bus.totalSeats
      );


    if (invalidSeat !== undefined) {
      return res.status(400).json({
        message: `Invalid seat number: ${invalidSeat}`,
      });
    }


    // Check whether any requested
    // seat is already booked
    const existingBooking =
      await Booking.findOne({
        schedule: scheduleId,

        status: "confirmed",

        seats: {
          $in: uniqueSeats,
        },
      });


    if (existingBooking) {
      const alreadyBookedSeats =
        existingBooking.seats.filter(
          (seat) =>
            uniqueSeats.includes(
              seat
            )
        );

      return res.status(409).json({
        message:
          "One or more selected seats are already booked",

        seats:
          alreadyBookedSeats,
      });
    }


    // Fare must come from backend schedule
    const farePerSeat =
      schedule.fare;

    const totalAmount =
      farePerSeat *
      uniqueSeats.length;


    const booking =
      await Booking.create({
        passenger:
          req.user.userId,

        schedule:
          schedule._id,

        seats:
          uniqueSeats.sort(
            (a, b) => a - b
          ),

        farePerSeat,

        totalAmount,

        bookingReference:
          generateBookingReference(),
      });


    const populatedBooking =
      await Booking.findById(
        booking._id
      )
        .populate(
          "passenger",
          "name email"
        )
        .populate({
          path: "schedule",

          populate: [
            {
              path: "bus",

              select:
                "name registrationNumber model type totalSeats",
            },

            {
              path: "route",

              select:
                "origin destination distanceKm estimatedDurationMinutes",
            },
          ],
        });


    return res
      .status(201)
      .json({
        message:
          "Booking created successfully",

        booking:
          populatedBooking,
      });

  } catch (error) {
    console.error(
      "Create booking error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// GET CURRENT PASSENGER BOOKINGS
const getMyBookings = async (
  req,
  res
) => {
  try {
    const bookings =
      await Booking.find({
        passenger:
          req.user.userId,
      })
        .populate({
          path: "schedule",

          populate: [
            {
              path: "bus",

              select:
                "name registrationNumber model type totalSeats",
            },

            {
              path: "route",

              select:
                "origin destination distanceKm estimatedDurationMinutes",
            },
          ],
        })
        .sort({
          createdAt: -1,
        });


    return res.status(200).json({
      count: bookings.length,
      bookings,
    });

  } catch (error) {
    console.error(
      "Get passenger bookings error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// GET BOOKED SEATS FOR ONE SCHEDULE
const getBookedSeats = async (
  req,
  res
) => {
  try {
    const { scheduleId } =
      req.params;


    if (
      !mongoose.Types.ObjectId.isValid(
        scheduleId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid schedule ID",
      });
    }


    const schedule =
      await Schedule.findById(
        scheduleId
      );

    if (!schedule) {
      return res.status(404).json({
        message:
          "Schedule not found",
      });
    }


    const bookings =
      await Booking.find({
        schedule: scheduleId,
        status: "confirmed",
      }).select("seats");


    const bookedSeats =
      bookings.flatMap(
        (booking) =>
          booking.seats
      );


    return res.status(200).json({
      scheduleId,
      bookedSeats:
        bookedSeats.sort(
          (a, b) => a - b
        ),
      bookedCount:
        bookedSeats.length,
    });

  } catch (error) {
    console.error(
      "Get booked seats error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// CANCEL PASSENGER BOOKING
const cancelBooking = async (
  req,
  res
) => {
  try {
    const bookingId =
      req.params.id;


    if (
      !mongoose.Types.ObjectId.isValid(
        bookingId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid booking ID",
      });
    }


    const booking =
      await Booking.findOne({
        _id: bookingId,

        passenger:
          req.user.userId,
      }).populate("schedule");


    if (!booking) {
      return res.status(404).json({
        message:
          "Booking not found",
      });
    }


    if (
      booking.status ===
      "cancelled"
    ) {
      return res.status(400).json({
        message:
          "Booking is already cancelled",
      });
    }


    if (
      booking.schedule &&
      new Date(
        booking.schedule
          .departureTime
      ) <= new Date()
    ) {
      return res.status(400).json({
        message:
          "Past journeys cannot be cancelled",
      });
    }


    booking.status =
      "cancelled";

    booking.cancelledAt =
      new Date();

    await booking.save();


    return res.status(200).json({
      message:
        "Booking cancelled successfully",

      booking,
    });

  } catch (error) {
    console.error(
      "Cancel booking error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// ADMIN - GET ALL BOOKINGS
const getAllBookings = async (
  req,
  res
) => {
  try {
    const bookings =
      await Booking.find()
        .populate(
          "passenger",
          "name email"
        )
        .populate({
          path: "schedule",

          populate: [
            {
              path: "bus",

              select:
                "name registrationNumber",
            },

            {
              path: "route",

              select:
                "origin destination",
            },
          ],
        })
        .sort({
          createdAt: -1,
        });


    return res.status(200).json({
      count: bookings.length,
      bookings,
    });

  } catch (error) {
    console.error(
      "Get all bookings error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  createBooking,
  getMyBookings,
  getBookedSeats,
  cancelBooking,
  getAllBookings,
};