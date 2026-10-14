"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminProfile() {
      const token = localStorage.getItem("token");

      // No token = user is not logged in
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/profile`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        // Invalid or expired token
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          window.dispatchEvent(
            new Event("authChanged")
          );

          router.replace("/login");
          return;
        }

        // Logged in but not an administrator
        if (response.status === 403) {
          router.replace("/dashboard");
          return;
        }

        if (!response.ok) {
          setError(
            data.message ||
              "Unable to load admin dashboard."
          );

          return;
        }

        // Admin verified by backend
        setAdmin(data.admin);

      } catch (error) {
        console.error(
          "Admin profile fetch error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );

      } finally {
        setLoading(false);
      }
    }

    loadAdminProfile();

  }, [router]);


  // Loading screen
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <p className="text-gray-500">
          Loading admin dashboard...
        </p>

      </main>
    );
  }


  // Error screen
  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">

        <div className="bg-red-100 text-red-700 p-5 rounded-lg">
          {error}
        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <section className="bg-slate-900 text-white py-10 px-6">

        <div className="max-w-6xl mx-auto">

          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>

          <p className="text-gray-300 mt-2">
            Welcome, {admin?.name}
          </p>

          <p className="text-gray-400 mt-1">
            {admin?.email}
          </p>

        </div>

      </section>


      {/* Dashboard */}
      <section className="max-w-6xl mx-auto px-6 py-10">

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white rounded-xl shadow-md p-6">

            <p className="text-gray-500">
              Total Buses
            </p>

            <p className="text-3xl font-bold mt-2">
              12
            </p>

          </div>


          <div className="bg-white rounded-xl shadow-md p-6">

            <p className="text-gray-500">
              Active Routes
            </p>

            <p className="text-3xl font-bold mt-2">
              8
            </p>

          </div>


          <div className="bg-white rounded-xl shadow-md p-6">

            <p className="text-gray-500">
              Today's Bookings
            </p>

            <p className="text-3xl font-bold mt-2">
              45
            </p>

          </div>


          <div className="bg-white rounded-xl shadow-md p-6">

            <p className="text-gray-500">
              Today's Revenue
            </p>

            <p className="text-3xl font-bold mt-2">
              Rs. 125,000
            </p>

          </div>

        </div>


        {/* Management section */}
        <div className="mt-10">

          <h2 className="text-2xl font-bold mb-6">
            Management
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            {/* Buses */}
            <Link
              href="/admin/buses"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >

              <h3 className="text-xl font-bold">
                Manage Buses
              </h3>

              <p className="text-gray-500 mt-2">
                Add, edit and remove buses.
              </p>

              <p className="text-yellow-600 font-semibold mt-4">
                Open →
              </p>

            </Link>


            {/* Routes */}
            <Link
              href="/admin/routes"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >

              <h3 className="text-xl font-bold">
                Manage Routes
              </h3>

              <p className="text-gray-500 mt-2">
                Create and manage bus routes.
              </p>

              <p className="text-yellow-600 font-semibold mt-4">
                Open →
              </p>

            </Link>


            {/* Schedules */}
            <Link
              href="/admin/schedules"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >

              <h3 className="text-xl font-bold">
                Manage Schedules
              </h3>

              <p className="text-gray-500 mt-2">
                Manage departure and arrival schedules.
              </p>

              <p className="text-yellow-600 font-semibold mt-4">
                Open →
              </p>

            </Link>


            {/* Bookings */}
            <Link
              href="/admin/bookings"
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >

              <h3 className="text-xl font-bold">
                View Bookings
              </h3>

              <p className="text-gray-500 mt-2">
                View passenger booking information.
              </p>

              <p className="text-yellow-600 font-semibold mt-4">
                Open →
              </p>

            </Link>

          </div>

        </div>


        {/* Recent bookings */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-10">

          <h2 className="text-2xl font-bold mb-6">
            Recent Bookings
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="border-b">

                <tr>

                  <th className="py-3 pr-4">
                    Reference
                  </th>

                  <th className="py-3 pr-4">
                    Passenger
                  </th>

                  <th className="py-3 pr-4">
                    Journey
                  </th>

                  <th className="py-3 pr-4">
                    Seat
                  </th>

                  <th className="py-3">
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                <tr className="border-b">

                  <td className="py-4 pr-4">
                    LB001
                  </td>

                  <td className="py-4 pr-4">
                    John Silva
                  </td>

                  <td className="py-4 pr-4">
                    Colombo → Galle
                  </td>

                  <td className="py-4 pr-4">
                    12
                  </td>

                  <td className="py-4 text-green-600 font-semibold">
                    Confirmed
                  </td>

                </tr>


                <tr>

                  <td className="py-4 pr-4">
                    LB002
                  </td>

                  <td className="py-4 pr-4">
                    Nimal Perera
                  </td>

                  <td className="py-4 pr-4">
                    Colombo → Kandy
                  </td>

                  <td className="py-4 pr-4">
                    24
                  </td>

                  <td className="py-4 text-green-600 font-semibold">
                    Confirmed
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </section>

    </main>
  );
}