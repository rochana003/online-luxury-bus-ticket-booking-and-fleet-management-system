const express = require("express");

const protect = require(
  "../middleware/authMiddleware"
);

const passengerOnly = require(
  "../middleware/passengerMiddleware"
);

const adminOnly = require(
  "../middleware/adminMiddleware"
);

const {
  createBooking,
  getMyBookings,
  getBookedSeats,
  cancelBooking,
  getAllBookings,
} = require(
  "../controllers/bookingController"
);

const router = express.Router();


// Public:
// Get unavailable seats
router.get(
  "/schedule/:scheduleId/seats",
  getBookedSeats
);


// Passenger:
// Create booking
router.post(
  "/",
  protect,
  passengerOnly,
  createBooking
);


// Passenger:
// Get own bookings
router.get(
  "/my",
  protect,
  passengerOnly,
  getMyBookings
);


// Passenger:
// Cancel own booking
router.patch(
  "/:id/cancel",
  protect,
  passengerOnly,
  cancelBooking
);


// Admin:
// Get every booking
router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllBookings
);


module.exports = router;