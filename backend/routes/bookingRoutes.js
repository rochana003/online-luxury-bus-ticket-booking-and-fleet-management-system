const express = require("express");
const protect = require("../middleware/authMiddleware");
const passengerOnly = require("../middleware/passengerMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const {
  createBooking,
  getMyBookings,
  getBookedSeats,
  cancelBooking,
  getAllBookings,
} = require("../controllers/bookingController");

const router = express.Router();

// Seat availability for a schedule
router.get("/schedule/:scheduleId/seats", getBookedSeats);

// Passenger bookings
router.post("/", protect, passengerOnly, createBooking);
router.get("/my", protect, passengerOnly, getMyBookings);
router.patch("/:id/cancel", protect, passengerOnly, cancelBooking);

// Admin booking management
router.get("/admin/all", protect, adminOnly, getAllBookings);

module.exports = router;
