const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const journeyRoutes = require("./routes/journeyRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

dotenv.config();


connectDB();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

// Middleware
app.use(express.json());

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "Luxury Bus Booking API is working!",
  });
});



// User routes
app.use("/api/users", userRoutes);
// Admin routes
app.use("/api/admin", adminRoutes);
// Bus routes
app.use("/api/buses", busRoutes);
// Route routes
app.use("/api/routes", routeRoutes);
// Schedule routes
app.use("/api/schedules", scheduleRoutes);
// Journey routes
app.use("/api/journeys", journeyRoutes);
// Booking routes
app.use("/api/bookings", bookingRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});