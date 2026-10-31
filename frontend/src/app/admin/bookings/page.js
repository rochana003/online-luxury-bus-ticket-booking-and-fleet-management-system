"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  function logoutAndRedirect() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChanged"));
    router.replace("/login");
  }

  async function loadBookings() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/admin/all`,
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
        router.replace("/dashboard");
        return;
      }

      if (!response.ok) {
        setError(data.message || "Unable to load bookings.");
        return;
      }

      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Admin bookings error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
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

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const totalRevenue = confirmedBookings.reduce(
    (total, b) => total + Number(b.totalAmount || 0),
    0
  );

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading bookings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <section className="bg-slate-900 text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">Passenger Bookings</h1>
          <p className="text-gray-300 mt-1">Review all system reservations and payment status.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
            <p className="text-3xl font-bold mt-2 text-slate-800">{bookings.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Confirmed</p>
            <p className="text-3xl font-bold mt-2 text-green-600">
              {confirmedBookings.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Cancelled</p>
            <p className="text-3xl font-bold mt-2 text-red-600">
              {cancelledBookings.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Confirmed Revenue</p>
            <p className="text-3xl font-bold mt-2 text-amber-600">
              Rs. {totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bookings Table Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Booking List</h2>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {filteredBookings.length === 0 ? (
            <p className="text-gray-500">No bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1100px] text-sm">
                <thead className="border-b border-gray-200 text-gray-500 font-medium">
                  <tr>
                    <th className="py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Passenger</th>
                    <th className="py-3 pr-4">Journey</th>
                    <th className="py-3 pr-4">Bus</th>
                    <th className="py-3 pr-4">Departure</th>
                    <th className="py-3 pr-4">Seats</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Booked On</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => {
                    const passenger = booking.passenger;
                    const schedule = booking.schedule;
                    const route = schedule?.route;
                    const bus = schedule?.bus;

                    return (
                      <tr key={booking._id} className="hover:bg-gray-50 transition align-top">
                        <td className="py-4 pr-4 font-semibold text-gray-800">
                          {booking.bookingReference}
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-gray-800">
                            {passenger?.name || "Unknown Passenger"}
                          </p>
                          <p className="text-xs text-gray-500">{passenger?.email || "-"}</p>
                        </td>
                        <td className="py-4 pr-4 text-gray-700">
                          {route ? `${route.origin} → ${route.destination}` : "Route unavailable"}
                        </td>
                        <td className="py-4 pr-4 text-gray-700">
                          <p className="font-semibold text-gray-800">
                            {bus?.registrationNumber || bus?.name || "Bus unavailable"}
                          </p>
                          {(bus?.model || bus?.type) && (
                            <p className="text-xs text-gray-500">{bus?.model || bus?.type}</p>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-gray-600 text-xs">
                          {formatDateTime(schedule?.departureTime)}
                        </td>
                        <td className="py-4 pr-4 font-semibold text-gray-800">
                          {booking.seats?.slice().sort((a, b) => a - b).join(", ") || "-"}
                        </td>
                        <td className="py-4 pr-4 font-semibold text-gray-800">
                          Rs. {Number(booking.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-4 pr-4 text-gray-500 text-xs">
                          {formatDateTime(booking.createdAt)}
                        </td>
                        <td className="py-4">
                          <span
                            className={
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold"
                                : "bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold"
                            }
                          >
                            {booking.status === "confirmed" ? "Confirmed" : "Cancelled"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
