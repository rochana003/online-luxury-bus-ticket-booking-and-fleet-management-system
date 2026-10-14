"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ManageRoutesPage() {
  const router = useRouter();

  const [routes, setRoutes] = useState([]);

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    distanceKm: "",
    estimatedDurationMinutes: "",
    status: "active",
  });

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // Verify administrator and load routes
  useEffect(() => {
    async function initializePage() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // Verify administrator
        const adminResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (adminResponse.status === 401) {
          logoutAndRedirect();
          return;
        }

        if (adminResponse.status === 403) {
          router.replace("/dashboard");
          return;
        }

        if (!adminResponse.ok) {
          setError("Unable to verify administrator.");
          return;
        }

        // Load routes
        await loadRoutes();

      } catch (error) {
        console.error(
          "Manage routes error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );

      } finally {
        setLoading(false);
      }
    }

    initializePage();

  }, [router]);


  function logoutAndRedirect() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.dispatchEvent(
      new Event("authChanged")
    );

    router.replace("/login");
  }


  // Get all routes
  async function loadRoutes() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/routes`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to load routes."
        );

        return;
      }

      setRoutes(data.routes || []);

    } catch (error) {
      console.error(
        "Load routes error:",
        error
      );

      setError(
        "Unable to load routes."
      );
    }
  }


  // Update form state
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  // Create or update route
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.origin ||
      !formData.destination ||
      !formData.distanceKm ||
      !formData.estimatedDurationMinutes
    ) {
      setError(
        "Please complete all required fields."
      );

      return;
    }

    if (
      formData.origin.trim().toLowerCase() ===
      formData.destination.trim().toLowerCase()
    ) {
      setError(
        "Origin and destination cannot be the same."
      );

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setSubmitting(true);

      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/routes/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/routes`;

      const response = await fetch(
        url,
        {
          method: isEditing
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            origin: formData.origin,
            destination: formData.destination,

            distanceKm: Number(
              formData.distanceKm
            ),

            estimatedDurationMinutes:
              Number(
                formData.estimatedDurationMinutes
              ),

            status: formData.status,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (response.status === 403) {
        setError("Admin access required.");
        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to save route."
        );

        return;
      }

      setSuccess(
        isEditing
          ? "Route updated successfully."
          : "Route added successfully."
      );

      resetForm();

      await loadRoutes();

    } catch (error) {
      console.error(
        "Save route error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );

    } finally {
      setSubmitting(false);
    }
  }


  // Load route into form for editing
  function startEditing(route) {
    setEditingId(route._id);

    setFormData({
      origin: route.origin,
      destination: route.destination,
      distanceKm: route.distanceKm,
      estimatedDurationMinutes:
        route.estimatedDurationMinutes,
      status: route.status,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // Clear form
  function resetForm() {
    setEditingId(null);

    setFormData({
      origin: "",
      destination: "",
      distanceKm: "",
      estimatedDurationMinutes: "",
      status: "active",
    });
  }


  // Delete route
  async function deleteRoute(routeId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this route?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/routes/${routeId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (response.status === 403) {
        setError("Admin access required.");
        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to delete route."
        );

        return;
      }

      setSuccess(
        "Route deleted successfully."
      );

      await loadRoutes();

    } catch (error) {
      console.error(
        "Delete route error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    }
  }


  // Convert minutes to readable duration
  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes} min`;
    }

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  }


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <p className="text-gray-500">
          Loading routes...
        </p>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <section className="bg-slate-900 text-white py-10 px-6">

        <div className="max-w-6xl mx-auto">

          <Link
            href="/admin"
            className="text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Admin Dashboard
          </Link>

          <h1 className="text-3xl font-bold mt-5">
            Manage Routes
          </h1>

          <p className="text-gray-300 mt-2">
            Create, edit and remove bus routes.
          </p>

        </div>

      </section>


      <section className="max-w-6xl mx-auto px-6 py-10">

        {/* Route form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-10">

          <h2 className="text-2xl font-bold mb-6">
            {editingId
              ? "Edit Route"
              : "Add New Route"}
          </h2>


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


          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            {/* Origin */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Origin
              </label>

              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="Colombo"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Destination */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Destination
              </label>

              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="Galle"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Distance */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Distance (km)
              </label>

              <input
                type="number"
                name="distanceKm"
                min="1"
                value={formData.distanceKm}
                onChange={handleChange}
                placeholder="125"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Duration */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Estimated Duration (minutes)
              </label>

              <input
                type="number"
                name="estimatedDurationMinutes"
                min="1"
                value={
                  formData.estimatedDurationMinutes
                }
                onChange={handleChange}
                placeholder="210"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

              <p className="text-xs text-gray-500 mt-2">
                Example: 210 minutes = 3 hours 30 minutes
              </p>

            </div>


            {/* Status */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3"
              >

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

            </div>


            {/* Buttons */}
            <div className="md:col-span-2 flex gap-4">

              <button
                type="submit"
                disabled={submitting}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold"
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Update Route"
                  : "Add Route"}
              </button>


              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </div>


        {/* Route list */}
        <div className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-2xl font-bold mb-6">
            Route List
          </h2>


          {routes.length === 0 ? (

            <p className="text-gray-500">
              No routes have been added yet.
            </p>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="border-b">

                  <tr>

                    <th className="py-3 pr-4">
                      Route
                    </th>

                    <th className="py-3 pr-4">
                      Distance
                    </th>

                    <th className="py-3 pr-4">
                      Duration
                    </th>

                    <th className="py-3 pr-4">
                      Status
                    </th>

                    <th className="py-3">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {routes.map((route) => (

                    <tr
                      key={route._id}
                      className="border-b"
                    >

                      <td className="py-4 pr-4 font-semibold">
                        {route.origin}
                        {" → "}
                        {route.destination}
                      </td>

                      <td className="py-4 pr-4">
                        {route.distanceKm} km
                      </td>

                      <td className="py-4 pr-4">
                        {formatDuration(
                          route.estimatedDurationMinutes
                        )}
                      </td>

                      <td className="py-4 pr-4">

                        <span
                          className={
                            route.status === "active"
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {route.status}
                        </span>

                      </td>

                      <td className="py-4">

                        <div className="flex gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(route)
                            }
                            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg"
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              deleteRoute(route._id)
                            }
                            className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}