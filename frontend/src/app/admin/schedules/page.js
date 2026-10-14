"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ManageSchedulesPage() {
  const router = useRouter();

  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [formData, setFormData] = useState({
    busId: "",
    routeId: "",
    departureTime: "",
    arrivalTime: "",
    fare: "",
    status: "scheduled",
  });

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


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

        // Load buses, routes and schedules
        await loadAllData();

      } catch (error) {
        console.error(
          "Schedule page error:",
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


  async function loadAllData() {
    try {
      const [
        busesResponse,
        routesResponse,
        schedulesResponse,
      ] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/buses`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/routes`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`,
          {
            cache: "no-store",
          }
        ),
      ]);


      const busesData =
        await busesResponse.json();

      const routesData =
        await routesResponse.json();

      const schedulesData =
        await schedulesResponse.json();


      if (!busesResponse.ok) {
        setError(
          busesData.message ||
            "Unable to load buses."
        );
        return;
      }

      if (!routesResponse.ok) {
        setError(
          routesData.message ||
            "Unable to load routes."
        );
        return;
      }

      if (!schedulesResponse.ok) {
        setError(
          schedulesData.message ||
            "Unable to load schedules."
        );
        return;
      }


      setBuses(
        Array.isArray(busesData)
          ? busesData
          : busesData.buses || []
      );

      setRoutes(
        Array.isArray(routesData)
          ? routesData
          : routesData.routes || []
      );

      setSchedules(
        Array.isArray(schedulesData)
          ? schedulesData
          : schedulesData.schedules || []
      );

    } catch (error) {
      console.error(
        "Load schedule data error:",
        error
      );

      setError(
        "Unable to load schedule data."
      );
    }
  }


  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.busId ||
      !formData.routeId ||
      !formData.departureTime ||
      !formData.arrivalTime ||
      formData.fare === ""
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }


    const departure =
      new Date(formData.departureTime);

    const arrival =
      new Date(formData.arrivalTime);


    if (
      Number.isNaN(departure.getTime()) ||
      Number.isNaN(arrival.getTime())
    ) {
      setError(
        "Please enter valid departure and arrival times."
      );
      return;
    }


    if (arrival <= departure) {
      setError(
        "Arrival time must be after departure time."
      );
      return;
    }


    if (Number(formData.fare) < 0) {
      setError(
        "Fare cannot be negative."
      );
      return;
    }


    const token =
      localStorage.getItem("token");

    if (!token) {
      logoutAndRedirect();
      return;
    }


    try {
      setSubmitting(true);

      const isEditing =
        Boolean(editingId);

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`;


      const response = await fetch(
        url,
        {
          method: isEditing
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            busId: formData.busId,
            routeId: formData.routeId,

            departureTime:
              departure.toISOString(),

            arrivalTime:
              arrival.toISOString(),

            fare: Number(
              formData.fare
            ),

            status: formData.status,
          }),
        }
      );


      const data =
        await response.json();


      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }


      if (response.status === 403) {
        setError(
          "Admin access required."
        );
        return;
      }


      if (!response.ok) {
        setError(
          data.message ||
            "Unable to save schedule."
        );
        return;
      }


      setSuccess(
        isEditing
          ? "Schedule updated successfully."
          : "Schedule created successfully."
      );

      resetForm();

      await loadAllData();

    } catch (error) {
      console.error(
        "Save schedule error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );

    } finally {
      setSubmitting(false);
    }
  }


  function startEditing(schedule) {
    setEditingId(schedule._id);

    setFormData({
      busId:
        schedule.bus?._id ||
        schedule.bus ||
        "",

      routeId:
        schedule.route?._id ||
        schedule.route ||
        "",

      departureTime:
        formatDateForInput(
          schedule.departureTime
        ),

      arrivalTime:
        formatDateForInput(
          schedule.arrivalTime
        ),

      fare: schedule.fare,

      status:
        schedule.status ||
        "scheduled",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function resetForm() {
    setEditingId(null);

    setFormData({
      busId: "",
      routeId: "",
      departureTime: "",
      arrivalTime: "",
      fare: "",
      status: "scheduled",
    });
  }


  async function deleteSchedule(
    scheduleId
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this schedule?"
      );

    if (!confirmed) {
      return;
    }


    const token =
      localStorage.getItem("token");

    if (!token) {
      logoutAndRedirect();
      return;
    }


    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/${scheduleId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );


      const data =
        await response.json();


      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }


      if (response.status === 403) {
        setError(
          "Admin access required."
        );
        return;
      }


      if (!response.ok) {
        setError(
          data.message ||
            "Unable to delete schedule."
        );
        return;
      }


      setSuccess(
        "Schedule deleted successfully."
      );

      await loadAllData();

    } catch (error) {
      console.error(
        "Delete schedule error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    }
  }


  // Convert MongoDB ISO date into datetime-local format
  function formatDateForInput(
    dateString
  ) {
    const date =
      new Date(dateString);

    const pad = (number) =>
      String(number).padStart(
        2,
        "0"
      );

    return (
      `${date.getFullYear()}-` +
      `${pad(
        date.getMonth() + 1
      )}-` +
      `${pad(
        date.getDate()
      )}T` +
      `${pad(
        date.getHours()
      )}:` +
      `${pad(
        date.getMinutes()
      )}`
    );
  }


  function formatDateTime(
    dateString
  ) {
    return new Date(
      dateString
    ).toLocaleString(
      "en-LK",
      {
        timeZone: "Asia/Colombo",

        year: "numeric",
        month: "short",
        day: "2-digit",

        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <p className="text-gray-500">
          Loading schedules...
        </p>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <section className="bg-slate-900 text-white py-10 px-6">

        <div className="max-w-7xl mx-auto">

          <Link
            href="/admin"
            className="text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Admin Dashboard
          </Link>


          <h1 className="text-3xl font-bold mt-5">
            Manage Schedules
          </h1>


          <p className="text-gray-300 mt-2">
            Create and manage bus journey schedules.
          </p>

        </div>

      </section>


      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* Schedule Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-10">

          <h2 className="text-2xl font-bold mb-6">

            {editingId
              ? "Edit Schedule"
              : "Add New Schedule"}

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

            {/* Bus */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Bus
              </label>

              <select
                name="busId"
                value={formData.busId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3"
              >

                <option value="">
                  Select a bus
                </option>


                {buses.map((bus) => (

                  <option
                    key={bus._id}
                    value={bus._id}
                    disabled={
                      bus.status ===
                      "inactive"
                    }
                  >
                    {bus.name}
                    {" - "}
                    {bus.registrationNumber}

                    {bus.status ===
                    "inactive"
                      ? " (Inactive)"
                      : ""}
                  </option>

                ))}

              </select>

            </div>


            {/* Route */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Route
              </label>

              <select
                name="routeId"
                value={formData.routeId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3"
              >

                <option value="">
                  Select a route
                </option>


                {routes.map((route) => (

                  <option
                    key={route._id}
                    value={route._id}
                    disabled={
                      route.status ===
                      "inactive"
                    }
                  >
                    {route.origin}
                    {" → "}
                    {route.destination}

                    {route.status ===
                    "inactive"
                      ? " (Inactive)"
                      : ""}
                  </option>

                ))}

              </select>

            </div>


            {/* Departure */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Departure Time
              </label>

              <input
                type="datetime-local"
                name="departureTime"
                value={
                  formData.departureTime
                }
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Arrival */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Arrival Time
              </label>

              <input
                type="datetime-local"
                name="arrivalTime"
                value={
                  formData.arrivalTime
                }
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Fare */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Fare (Rs.)
              </label>

              <input
                type="number"
                name="fare"
                min="0"
                step="0.01"
                value={formData.fare}
                onChange={handleChange}
                placeholder="2500"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

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

                <option value="scheduled">
                  Scheduled
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

                <option value="completed">
                  Completed
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
                  ? "Update Schedule"
                  : "Add Schedule"}

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


        {/* Schedule List */}
        <div className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-2xl font-bold mb-6">
            Schedule List
          </h2>


          {schedules.length === 0 ? (

            <p className="text-gray-500">
              No schedules have been added yet.
            </p>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="border-b">

                  <tr>

                    <th className="py-3 pr-4">
                      Bus
                    </th>

                    <th className="py-3 pr-4">
                      Route
                    </th>

                    <th className="py-3 pr-4">
                      Departure
                    </th>

                    <th className="py-3 pr-4">
                      Arrival
                    </th>

                    <th className="py-3 pr-4">
                      Fare
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

                  {schedules.map(
                    (schedule) => (

                      <tr
                        key={schedule._id}
                        className="border-b"
                      >

                        <td className="py-4 pr-4">

                          <p className="font-semibold">
                            {schedule.bus
                              ?.name ||
                              "Unknown Bus"}
                          </p>

                          <p className="text-sm text-gray-500">
                            {
                              schedule.bus
                                ?.registrationNumber
                            }
                          </p>

                        </td>


                        <td className="py-4 pr-4">

                          {schedule.route ? (
                            <>
                              {
                                schedule.route
                                  .origin
                              }
                              {" → "}
                              {
                                schedule.route
                                  .destination
                              }
                            </>
                          ) : (
                            "Unknown Route"
                          )}

                        </td>


                        <td className="py-4 pr-4">
                          {formatDateTime(
                            schedule.departureTime
                          )}
                        </td>


                        <td className="py-4 pr-4">
                          {formatDateTime(
                            schedule.arrivalTime
                          )}
                        </td>


                        <td className="py-4 pr-4 font-semibold">
                          Rs.{" "}
                          {Number(
                            schedule.fare
                          ).toLocaleString()}
                        </td>


                        <td className="py-4 pr-4">

                          <span
                            className={
                              schedule.status ===
                              "scheduled"
                                ? "text-green-600 font-semibold"
                                : schedule.status ===
                                  "cancelled"
                                ? "text-red-600 font-semibold"
                                : "text-gray-600 font-semibold"
                            }
                          >
                            {schedule.status}
                          </span>

                        </td>


                        <td className="py-4">

                          <div className="flex gap-3">

                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  schedule
                                )
                              }
                              className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg"
                            >
                              Edit
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                deleteSchedule(
                                  schedule._id
                                )
                              }
                              className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>

    </main>
  );
}