"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("token");

      // No token = not logged in
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
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

        if (!response.ok) {
          setError(
            data.message || "Unable to load profile"
          );
          return;
        }

        // Only passengers should use passenger dashboard
        if (data.user.role !== "passenger") {
          router.replace("/admin");
          return;
        }

        setUser(data.user);

      } catch (error) {
        console.error(
          "Profile fetch error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );

      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">
          Loading dashboard...
        </p>
      </main>
    );
  }


  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">

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
            Passenger Dashboard
          </h1>

          <p className="text-gray-300 mt-2">
            Welcome, {user?.name}
          </p>

        </div>

      </section>


      <section className="max-w-6xl mx-auto px-6 py-10">

        {/* User information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">

          <h2 className="text-2xl font-bold mb-5">
            My Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <p className="text-sm text-gray-500">
                Name
              </p>

              <p className="font-semibold">
                {user?.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="font-semibold">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Account Type
              </p>

              <p className="font-semibold capitalize">
                {user?.role}
              </p>
            </div>

          </div>

        </div>


        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          <div className="bg-white rounded-xl shadow-md p-6">

            <p className="text-gray-500">
              Upcoming Bookings
            </p>

            <p className="text-3xl font-bold mt-2">
              0
            </p>

          </div>


          <div className="bg-white rounded-xl shadow-md p-6">

            <p className="text-gray-500">
              Completed Trips
            </p>

            <p className="text-3xl font-bold mt-2">
              0
            </p>

          </div>


          <div className="bg-white rounded-xl shadow-md p-6">

            <p className="text-gray-500">
              Cancelled Bookings
            </p>

            <p className="text-3xl font-bold mt-2">
              0
            </p>

          </div>

        </div>


        {/* Booking section */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center">

          <h2 className="text-2xl font-bold">
            My Bookings
          </h2>

          <p className="text-gray-500 mt-3">
            You do not have any bookings yet.
          </p>

        </div>

      </section>

    </main>
  );
}