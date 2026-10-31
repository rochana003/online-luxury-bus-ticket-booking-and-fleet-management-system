"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    initializeDashboard();
  }, []);

  function logoutAndRedirect() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChanged"));
    router.replace("/login");
  }

  async function initializeDashboard() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const profileResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const profileData = await profileResponse.json();

      if (profileResponse.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!profileResponse.ok) {
        setError(profileData.message || "Unable to load profile.");
        return;
      }

      if (profileData.user.role !== "passenger") {
        router.replace("/admin");
        return;
      }

      setUser(profileData.user);
      await loadBookings();
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBookings() {
    const token = localStorage.getItem("token");
    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (response.status === 403) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        setError(data.message || "Unable to load bookings.");
        return;
      }

      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Load bookings error:", err);
      setError("Unable to load bookings.");
    }
  }

  async function cancelBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setCancellingId(bookingId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        setError(data.message || "Unable to cancel booking.");
        return;
      }

      setSuccess("Booking cancelled successfully.");
      await loadBookings();
    } catch (err) {
      console.error("Cancel booking error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setCancellingId(null);
    }
  }

  function formatDateTime(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-LK", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getBookingCategory(booking) {
    if (booking.status === "cancelled") {
      return "cancelled";
    }

    const now = new Date();
    const departure = booking.schedule?.departureTime ? new Date(booking.schedule.departureTime) : null;
    const arrival = booking.schedule?.arrivalTime ? new Date(booking.schedule.arrivalTime) : null;

    if (arrival && arrival <= now) {
      return "completed";
    }
    if (departure && departure > now) {
      return "upcoming";
    }
    return "current";
  }

  function canCancelBooking(booking) {
    if (booking.status !== "confirmed") return false;
    if (!booking.schedule?.departureTime) return false;
    return new Date(booking.schedule.departureTime) > new Date();
  }

  const upcomingCount = bookings.filter((b) => getBookingCategory(b) === "upcoming").length;
  const completedCount = bookings.filter((b) => getBookingCategory(b) === "completed").length;
  const cancelledCount = bookings.filter((b) => getBookingCategory(b) === "cancelled").length;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <section className="bg-slate-900 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Passenger Dashboard</h1>
          <p className="text-gray-300 mt-2">Welcome, {user?.name}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-5">My Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold text-gray-800">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold text-gray-800">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="font-semibold capitalize text-gray-800">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Upcoming Bookings</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">{upcomingCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Completed Trips</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{completedCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Cancelled Bookings</p>
            <p className="text-3xl font-bold mt-2 text-gray-400">{cancelledCount}</p>
          </div>
        </div>

        {/* Bookings List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
            <Link
              href="/"
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-5 py-2 rounded-lg font-semibold transition"
            >
              Book Another Trip
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-10 text-center">
              <p className="text-gray-500">You do not have any bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => {
                const schedule = booking.schedule;
                const route = schedule?.route;
                const bus = schedule?.bus;
                const category = getBookingCategory(booking);

                let badgeClass = "bg-green-100 text-green-700";
                let statusLabel = "Confirmed";
                if (booking.status === "cancelled") {
                  badgeClass = "bg-red-100 text-red-700";
                  statusLabel = "Cancelled";
                } else if (category === "completed") {
                  badgeClass = "bg-gray-100 text-gray-700";
                  statusLabel = "Completed";
                }

                return (
                  <div key={booking._id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Booking Reference</p>
                        <p className="text-lg font-bold text-gray-800 tracking-wide">
                          {booking.bookingReference}
                        </p>
                      </div>
                      <span className={`${badgeClass} px-3.5 py-1.5 rounded-full text-xs font-semibold self-start`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-5">
                      <div>
                        <p className="text-xs text-gray-400">Journey</p>
                        <p className="font-semibold text-gray-800 mt-1">
                          {route ? `${route.origin} → ${route.destination}` : "Route unavailable"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Bus</p>
                        <p className="font-semibold text-gray-800 mt-1">
                          {bus?.model || bus?.name || bus?.registrationNumber || "Luxury Coach"}
                        </p>
                        {bus?.registrationNumber && (
                          <p className="text-xs text-gray-500">{bus.registrationNumber}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Departure</p>
                        <p className="font-semibold text-gray-800 mt-1">
                          {formatDateTime(schedule?.departureTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Arrival</p>
                        <p className="font-semibold text-gray-800 mt-1">
                          {formatDateTime(schedule?.arrivalTime)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="text-xs text-gray-500">Reserved Seats</p>
                        <p className="font-bold text-gray-800 mt-1">
                          {booking.seats?.slice().sort((a, b) => a - b).join(", ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fare per Seat</p>
                        <p className="font-bold text-gray-800 mt-1">
                          Rs. {Number(booking.farePerSeat).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Paid</p>
                        <p className="font-bold text-gray-800 mt-1">
                          Rs. {Number(booking.totalAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5 pt-2">
                      <p className="text-xs text-gray-400">
                        Booked on {formatDateTime(booking.createdAt)}
                      </p>

                      {canCancelBooking(booking) && (
                        <button
                          type="button"
                          onClick={() => cancelBooking(booking._id)}
                          disabled={cancellingId === booking._id}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg font-semibold transition"
                        >
                          {cancellingId === booking._id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
