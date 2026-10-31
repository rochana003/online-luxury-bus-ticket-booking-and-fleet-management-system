"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, [router]);

  function logoutAndRedirect() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChanged"));
    router.replace("/login");
  }

  async function loadDashboard() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const adminResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const adminData = await adminResponse.json();

      if (adminResponse.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (adminResponse.status === 403) {
        router.replace("/dashboard");
        return;
      }

      if (!adminResponse.ok) {
        setError(adminData.message || "Unable to verify administrator.");
        return;
      }

      setAdmin(adminData.admin);

      const [busesResponse, routesResponse, bookingsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buses`, { cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/routes`, { cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);

      const busesData = await busesResponse.json();
      const routesData = await routesResponse.json();
      const bookingsData = await bookingsResponse.json();

      if (bookingsResponse.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (bookingsResponse.status === 403) {
        router.replace("/dashboard");
        return;
      }

      if (!busesResponse.ok) {
        setError(busesData.message || "Unable to load buses.");
        return;
      }

      if (!routesResponse.ok) {
        setError(routesData.message || "Unable to load routes.");
        return;
      }

      if (!bookingsResponse.ok) {
        setError(bookingsData.message || "Unable to load bookings.");
        return;
      }

      setBuses(Array.isArray(busesData) ? busesData : busesData.buses || []);
      setRoutes(Array.isArray(routesData) ? routesData : routesData.routes || []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function getColomboDateKey(dateValue) {
    if (!dateValue) return "";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(dateValue));
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

  const todayKey = getColomboDateKey(new Date());
  const totalBuses = buses.length;
  const activeRoutes = routes.filter((r) => r.status === "active").length;
  const todayBookings = bookings.filter((b) => getColomboDateKey(b.createdAt) === todayKey);
  const todayRevenue = todayBookings
    .filter((b) => b.status === "confirmed")
    .reduce((total, b) => total + Number(b.totalAmount || 0), 0);

  const recentBookings = bookings.slice(0, 5);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading admin dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 text-red-700 p-5 rounded-lg">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <section className="bg-slate-900 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-300 mt-2">Welcome, {admin?.name}</p>
          <p className="text-gray-400 text-sm mt-0.5">{admin?.email}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Total Buses</p>
            <p className="text-3xl font-bold mt-2 text-slate-800">{totalBuses}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Active Routes</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">{activeRoutes}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Today&apos;s Bookings</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{todayBookings.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm font-medium">Today&apos;s Revenue</p>
            <p className="text-3xl font-bold mt-2 text-amber-600">
              Rs. {todayRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Management Portals */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Management</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/admin/buses"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition block border border-transparent hover:border-yellow-400"
            >
              <h3 className="text-lg font-bold text-gray-800">Manage Buses</h3>
              <p className="text-gray-500 text-sm mt-2">Add, edit and remove fleet buses.</p>
              <p className="text-yellow-600 font-semibold text-sm mt-4">Open →</p>
            </Link>

            <Link
              href="/admin/routes"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition block border border-transparent hover:border-yellow-400"
            >
              <h3 className="text-lg font-bold text-gray-800">Manage Routes</h3>
              <p className="text-gray-500 text-sm mt-2">Create and update bus routes.</p>
              <p className="text-yellow-600 font-semibold text-sm mt-4">Open →</p>
            </Link>

            <Link
              href="/admin/schedules"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition block border border-transparent hover:border-yellow-400"
            >
              <h3 className="text-lg font-bold text-gray-800">Manage Schedules</h3>
              <p className="text-gray-500 text-sm mt-2">Configure trip dates and departures.</p>
              <p className="text-yellow-600 font-semibold text-sm mt-4">Open →</p>
            </Link>

            <Link
              href="/admin/bookings"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition block border border-transparent hover:border-yellow-400"
            >
              <h3 className="text-lg font-bold text-gray-800">View Bookings</h3>
              <p className="text-gray-500 text-sm mt-2">View passenger reservations and status.</p>
              <p className="text-yellow-600 font-semibold text-sm mt-4">Open →</p>
            </Link>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Recent Bookings</h2>
            <Link
              href="/admin/bookings"
              className="text-yellow-600 font-semibold text-sm hover:text-yellow-500"
            >
              View All →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-gray-500">No bookings have been made yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[850px] text-sm">
                <thead className="border-b border-gray-200 text-gray-500 font-medium">
                  <tr>
                    <th className="py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Passenger</th>
                    <th className="py-3 pr-4">Journey</th>
                    <th className="py-3 pr-4">Seats</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Booked</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {recentBookings.map((booking) => {
                    const passenger = booking.passenger;
                    const schedule = booking.schedule;
                    const route = schedule?.route;

                    return (
                      <tr key={booking._id} className="hover:bg-gray-50 transition">
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
