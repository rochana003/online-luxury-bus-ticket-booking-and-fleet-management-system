const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    seats: [
      {
        type: Number,
        required: true,
        min: 1,
      },
    ],
    farePerSeat: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate seat allocations on the same schedule for active bookings
bookingSchema.index(
  { schedule: 1, seats: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "confirmed" },
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
