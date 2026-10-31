"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BusSearch() {
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/schedules`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : data.schedules || [];
          // Only include scheduled items with populated active routes
          const valid = list.filter(
            (s) =>
              s.route &&
              s.route.origin &&
              s.route.destination &&
              s.status === "scheduled"
          );
          setSchedules(valid);
        }
      } catch (err) {
        console.error("Failed to load schedules for search:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedules();
  }, []);

  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Derive unique origins strictly from admin-added schedules
  const availableOrigins = Array.from(
    new Set(
      schedules
        .map((s) => s.route?.origin?.trim())
        .filter(Boolean)
    )
  ).sort();

  // Derive available destinations matching the selected origin (or all destinations from added schedules)
  const availableDestinations = Array.from(
    new Set(
      schedules
        .filter((s) =>
          from ? s.route?.origin?.trim().toLowerCase() === from.trim().toLowerCase() : true
        )
        .map((s) => s.route?.destination?.trim())
        .filter(Boolean)
    )
  ).sort();

  function handleFromChange(newFrom) {
    setFrom(newFrom);
    // If the currently selected destination isn't valid for the new origin, reset it
    if (newFrom && to) {
      const validForNewOrigin = schedules
        .filter((s) => s.route?.origin?.trim().toLowerCase() === newFrom.trim().toLowerCase())
        .map((s) => s.route?.destination?.trim().toLowerCase());
      if (!validForNewOrigin.includes(to.trim().toLowerCase())) {
        setTo("");
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!from || !to || !date) {
      setError("Please select origin, destination and travel date.");
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      setError("Origin and destination cannot be the same.");
      return;
    }

    const selectedDate = new Date(`${date}T00:00:00+05:30`);
    const todayDate = new Date(`${todayString}T00:00:00+05:30`);

    if (selectedDate < todayDate) {
      setError("Travel date cannot be in the past.");
      return;
    }

    setError("");

    const params = new URLSearchParams({ from, to, date });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 max-w-5xl mx-auto text-left">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Find Your Bus
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <select
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
            disabled={loading || availableOrigins.length === 0}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">
              {loading
                ? "Loading origins..."
                : availableOrigins.length === 0
                ? "No schedules available"
                : "Select origin"}
            </option>
            {availableOrigins.map((loc) => (
              <option key={`from-${loc}`} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={loading || availableDestinations.length === 0}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">
              {loading
                ? "Loading destinations..."
                : availableDestinations.length === 0
                ? "No destinations available"
                : "Select destination"}
            </option>
            {availableDestinations.map((loc) => (
              <option key={`to-${loc}`} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Date
          </label>
          <input
            type="date"
            value={date}
            min={todayString}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            suppressHydrationWarning
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-yellow-500 text-slate-900 font-semibold p-3 rounded-lg hover:bg-yellow-400 transition"
          >
            Search Buses
          </button>
        </div>
      </form>

      {error && (
        <p className="text-red-600 mt-4 text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
