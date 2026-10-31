"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getTodayString() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addDaysToDateString(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00+05:30`);
  d.setDate(d.getDate() + Number(days));
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatDateForInput(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function getCurrentDateTimeLocal() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function ManageSchedulesPage() {
  const router = useRouter();

  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);

  // "everyday" (default) or "single"
  const [scheduleType, setScheduleType] = useState("everyday");

  const [formData, setFormData] = useState({
    busId: "",
    routeId: "",
    departureTimeOfDay: "08:00",
    arrivalTimeOfDay: "11:30",
    startDate: "",
    endDate: "",
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
    const today = getTodayString();
    setFormData((prev) => ({
      ...prev,
      startDate: today,
      endDate: addDaysToDateString(today, 30),
    }));

    async function initializePage() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const adminResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
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

        await loadAllData();
      } catch (err) {
        console.error("Schedule page error:", err);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [router]);

  function logoutAndRedirect() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChanged"));
    router.replace("/login");
  }

  async function loadAllData() {
    try {
      const [busesResponse, routesResponse, schedulesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buses`, { cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/routes`, { cache: "no-store" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedules`, { cache: "no-store" }),
      ]);

      const busesData = await busesResponse.json();
      const routesData = await routesResponse.json();
      const schedulesData = await schedulesResponse.json();

      if (!busesResponse.ok) {
        setError(busesData.message || "Unable to load buses.");
        return;
      }
      if (!routesResponse.ok) {
        setError(routesData.message || "Unable to load routes.");
        return;
      }
      if (!schedulesResponse.ok) {
        setError(schedulesData.message || "Unable to load schedules.");
        return;
      }

      setBuses(Array.isArray(busesData) ? busesData : busesData.buses || []);
      setRoutes(Array.isArray(routesData) ? routesData : routesData.routes || []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : schedulesData.schedules || []);
    } catch (err) {
      console.error("Load schedule data error:", err);
      setError("Unable to load schedule data.");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) {
      logoutAndRedirect();
      return;
    }

    const isEditing = Boolean(editingId);
    const isEveryday = !isEditing && scheduleType === "everyday";

    if (!formData.busId || !formData.routeId || formData.fare === "") {
      setError("Please complete all required fields.");
      return;
    }

    if (Number(formData.fare) < 0) {
      setError("Fare cannot be negative.");
      return;
    }

    let payload = {};

    if (isEveryday) {
      if (
        !formData.departureTimeOfDay ||
        !formData.arrivalTimeOfDay ||
        !formData.startDate ||
        !formData.endDate
      ) {
        setError("Please provide departure time, arrival time, start date and end date.");
        return;
      }

      if (formData.departureTimeOfDay === formData.arrivalTimeOfDay) {
        setError("Arrival time cannot be equal to departure time.");
        return;
      }

      if (formData.endDate < formData.startDate) {
        setError("End date must be on or after start date.");
        return;
      }

      payload = {
        isDaily: true,
        busId: formData.busId,
        routeId: formData.routeId,
        departureTimeOfDay: formData.departureTimeOfDay,
        arrivalTimeOfDay: formData.arrivalTimeOfDay,
        startDate: formData.startDate,
        endDate: formData.endDate,
        fare: Number(formData.fare),
      };
    } else {
      if (!formData.departureTime || !formData.arrivalTime) {
        setError("Please provide departure and arrival date and time.");
        return;
      }

      const departure = new Date(formData.departureTime);
      const arrival = new Date(formData.arrivalTime);

      if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
        setError("Please enter valid departure and arrival dates.");
        return;
      }

      if (arrival <= departure) {
        setError("Arrival time must be after departure time.");
        return;
      }

      payload = {
        busId: formData.busId,
        routeId: formData.routeId,
        departureTime: departure.toISOString(),
        arrivalTime: arrival.toISOString(),
        fare: Number(formData.fare),
        status: formData.status,
      };
    }

    try {
      setSubmitting(true);
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

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
        setError(data.message || "Unable to save schedule.");
        return;
      }

      setSuccess(data.message || (isEditing ? "Schedule updated successfully." : "Schedule added successfully."));
      resetForm();
      await loadAllData();
    } catch (err) {
      console.error("Save schedule error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(schedule) {
    setEditingId(schedule._id);
    setScheduleType("single");
    setFormData((prev) => ({
      ...prev,
      busId: schedule.bus?._id || schedule.bus || "",
      routeId: schedule.route?._id || schedule.route || "",
      departureTime: formatDateForInput(schedule.departureTime),
      arrivalTime: formatDateForInput(schedule.arrivalTime),
      fare: schedule.fare,
      status: schedule.status || "scheduled",
    }));
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setScheduleType("everyday");
    const today = getTodayString();
    setFormData({
      busId: "",
      routeId: "",
      departureTimeOfDay: "08:00",
      arrivalTimeOfDay: "11:30",
      startDate: today,
      endDate: addDaysToDateString(today, 30),
      departureTime: "",
      arrivalTime: "",
      fare: "",
      status: "scheduled",
    });
  }

  async function deleteSchedule(scheduleId) {
    const confirmed = window.confirm("Are you sure you want to delete this schedule?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
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
          headers: { Authorization: `Bearer ${token}` },
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
        setError(data.message || "Unable to delete schedule.");
        return;
      }

      setSuccess("Schedule deleted successfully.");
      await loadAllData();
    } catch (err) {
      console.error("Delete schedule error:", err);
      setError("Unable to connect to the server.");
    }
  }

  const minimumDateTime = getCurrentDateTimeLocal();
  const todayDateString = getTodayString();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading schedules...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <section className="bg-slate-900 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">Manage Schedules</h1>
          <p className="text-gray-300 mt-1">Configure departures, bus assignments and fares.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        {/* Schedule Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingId ? "Edit Schedule" : "Add New Schedule"}
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bus</label>
              <select
                name="busId"
                value={formData.busId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select a bus</option>
                {buses.map((bus) => (
                  <option
                    key={bus._id}
                    value={bus._id}
                    disabled={bus.status === "inactive"}
                  >
                    {bus.registrationNumber} - {bus.model}
                    {bus.status === "inactive" ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
              <select
                name="routeId"
                value={formData.routeId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select a route</option>
                {routes.map((route) => (
                  <option
                    key={route._id}
                    value={route._id}
                    disabled={route.status === "inactive"}
                  >
                    {route.origin} → {route.destination}
                    {route.status === "inactive" ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {!editingId && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type
                </label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full md:w-1/2 border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="everyday">Everyday (Runs daily)</option>
                  <option value="single">Single date (Special instance)</option>
                </select>
              </div>
            )}

            {!editingId && scheduleType === "everyday" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Departure Time
                  </label>
                  <input
                    type="time"
                    name="departureTimeOfDay"
                    value={formData.departureTimeOfDay}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Arrival Time
                  </label>
                  <input
                    type="time"
                    name="arrivalTimeOfDay"
                    value={formData.arrivalTimeOfDay}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    min={todayDateString}
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    min={formData.startDate || todayDateString}
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <input
                    type="datetime-local"
                    name="departureTime"
                    min={editingId ? undefined : minimumDateTime}
                    value={formData.departureTime}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time
                  </label>
                  <input
                    type="datetime-local"
                    name="arrivalTime"
                    min={formData.departureTime || minimumDateTime}
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </>
            )}

            <div className={!editingId && scheduleType === "everyday" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fare (Rs.)</label>
              <input
                type="number"
                name="fare"
                min="0"
                step="0.01"
                value={formData.fare}
                onChange={handleChange}
                placeholder="2500"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="md:col-span-2 flex gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-300 text-slate-900 px-6 py-3 rounded-lg font-semibold transition"
              >
                {submitting ? "Saving..." : editingId ? "Update Schedule" : "Add Schedule"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Schedule List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Schedules ({schedules.length})
          </h2>

          {schedules.length === 0 ? (
            <p className="text-gray-500">No schedules have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[750px] text-sm">
                <thead className="border-b border-gray-200 text-gray-500 font-medium">
                  <tr>
                    <th className="py-3 pr-4">Bus</th>
                    <th className="py-3 pr-4">Route</th>
                    <th className="py-3 pr-4">Departure</th>
                    <th className="py-3 pr-4">Arrival</th>
                    <th className="py-3 pr-4">Fare</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {schedules.map((schedule) => (
                    <tr key={schedule._id} className="hover:bg-gray-50 transition">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-gray-800">
                          {schedule.bus?.registrationNumber || schedule.bus?.name || "Unknown Bus"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {schedule.bus?.model || schedule.bus?.type || ""}
                        </p>
                      </td>

                      <td className="py-4 pr-4 text-gray-700">
                        {schedule.route ? (
                          `${schedule.route.origin} → ${schedule.route.destination}`
                        ) : (
                          "Unknown Route"
                        )}
                      </td>

                      <td className="py-4 pr-4 text-gray-600">
                        {formatDateTime(schedule.departureTime)}
                      </td>

                      <td className="py-4 pr-4 text-gray-600">
                        {formatDateTime(schedule.arrivalTime)}
                      </td>

                      <td className="py-4 pr-4 font-semibold text-gray-800">
                        Rs. {Number(schedule.fare).toLocaleString()}
                      </td>

                      <td className="py-4 pr-4">
                        <span
                          className={
                            schedule.status === "scheduled"
                              ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold"
                              : schedule.status === "cancelled"
                              ? "bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold"
                              : "bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold"
                          }
                        >
                          {schedule.status}
                        </span>
                      </td>

                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(schedule)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md font-medium transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSchedule(schedule._id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-md font-medium transition"
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
