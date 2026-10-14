"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BusSearch() {
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    // Check that all fields are filled
    if (!from || !to || !date) {
      setError("Please select origin, destination and travel date.");
      return;
    }

    // Prevent same origin and destination
    if (from === to) {
      setError("Origin and destination cannot be the same.");
      return;
    }

    setError("");

    const params = new URLSearchParams({
      from: from,
      to: to,
      date: date,
    });

    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 max-w-5xl mx-auto">

      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Find Your Bus
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >

        {/* FROM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>

          <select
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3"
          >
            <option value="">Select origin</option>
            <option value="Colombo">Colombo</option>
            <option value="Kandy">Kandy</option>
            <option value="Galle">Galle</option>
          </select>
        </div>

        {/* TO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>

          <select
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3"
          >
            <option value="">Select destination</option>
            <option value="Colombo">Colombo</option>
            <option value="Kandy">Kandy</option>
            <option value="Galle">Galle</option>
          </select>
        </div>

        {/* DATE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Date
          </label>

          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3"
          />
        </div>

        {/* SEARCH BUTTON */}
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-yellow-500 text-black font-semibold p-3 rounded-lg hover:bg-yellow-400"
          >
            Search Buses
          </button>
        </div>

      </form>

      {/* Validation error */}
      {error && (
        <p className="text-red-600 mt-4 text-sm">
          {error}
        </p>
      )}

    </div>
  );
}