"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SeatLayout({ scheduleId, fare }) {
  const router = useRouter();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bookingReference, setBookingReference] = useState("");

  // Standard 51-seat luxury bus layout configuration
  const seatRows = [
    [3, 4, 2, 1],
    [7, 8, 6, 5],
    [11, 12, 10, 9],
    [15, 16, 14, 13],
    [19, 20, 18, 17],
    [23, 24, 22, 21],
    [27, 28, 26, 25],
    [31, 32, 30, 29],
    [35, 36, 34, 33],
    [39, 40, 38, 37],
    [43, 44, 42, 41],
    [45, 46],
    [49, 50, 51, 48, 47],
  ];

  useEffect(() => {
    loadBookedSeats();
  }, [scheduleId]);

  async function loadBookedSeats() {
    try {
      setLoadingSeats(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/schedule/${scheduleId}/seats`,
        { cache: "no-store" }
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to load seat availability.");
        return;
      }

      setBookedSeats(data.bookedSeats || []);
    } catch (err) {
      console.error("Seat availability error:", err);
      setError("Unable to load seat availability.");
    } finally {
      setLoadingSeats(false);
    }
  }

  function handleSeatClick(seatNumber) {
    setError("");
    setSuccess("");

    if (bookedSeats.includes(seatNumber)) {
      return;
    }

    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      }
      return [...prev, seatNumber];
    });
  }

  function getSeatClass(seatNumber) {
    const base = "w-11 h-11 sm:w-12 sm:h-12 rounded-lg font-semibold border text-sm transition";

    if (bookedSeats.includes(seatNumber)) {
      return `${base} bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed`;
    }

    if (selectedSeats.includes(seatNumber)) {
      return `${base} bg-yellow-500 text-slate-900 border-yellow-500 shadow-sm`;
    }

    return `${base} bg-white text-gray-800 border-gray-300 hover:bg-yellow-50 hover:border-yellow-400`;
  }

  async function handleBooking() {
    setError("");
    setSuccess("");

    if (selectedSeats.length === 0) {
      setError("Please select at least one seat.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setBooking(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            scheduleId,
            seats: selectedSeats,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authChanged"));
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setError("Please login with a passenger account to make a booking.");
        return;
      }

      if (response.status === 409) {
        setError(data.message || "One or more selected seats are no longer available.");
        await loadBookedSeats();
        setSelectedSeats([]);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Unable to create booking.");
        return;
      }

      setSuccess("Booking confirmed successfully.");
      setBookingReference(data.booking.bookingReference);
      setSelectedSeats([]);
      await loadBookedSeats();
    } catch (err) {
      console.error("Booking error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setBooking(false);
    }
  }

  const totalAmount = selectedSeats.length * Number(fare);

  if (loadingSeats) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <p className="text-gray-500">Loading seat availability...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Select Your Seats
      </h2>
      <p className="text-xs text-gray-400 uppercase tracking-widest text-center mt-2 font-medium">
        Front of Bus
      </p>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
          <span className="text-xs text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-xs text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span className="text-xs text-gray-600">Booked</span>
        </div>
      </div>

      {/* Driver Indicator */}
      <div className="max-w-sm mx-auto mb-4 flex justify-end">
        <div className="border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-500 font-medium">
          Driver 🚌
        </div>
      </div>

      {/* Seat Grid */}
      <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
        {seatRows.map((row, rowIndex) => {
          // Last 5-seat row
          if (row.length === 5) {
            return (
              <div key={rowIndex} className="flex justify-center gap-2">
                {row.map((seatNumber) => (
                  <button
                    key={seatNumber}
                    type="button"
                    disabled={bookedSeats.includes(seatNumber)}
                    onClick={() => handleSeatClick(seatNumber)}
                    className={getSeatClass(seatNumber)}
                  >
                    {seatNumber}
                  </button>
                ))}
              </div>
            );
          }

          // Row 12 (seats 45 & 46 on right side)
          if (row.length === 2) {
            return (
              <div key={rowIndex} className="flex justify-center items-center">
                <div className="w-[104px]"></div>
                <div className="w-8"></div>
                <div className="flex gap-2">
                  {row.map((seatNumber) => (
                    <button
                      key={seatNumber}
                      type="button"
                      disabled={bookedSeats.includes(seatNumber)}
                      onClick={() => handleSeatClick(seatNumber)}
                      className={getSeatClass(seatNumber)}
                    >
                      {seatNumber}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // Standard 2 + aisle + 2 arrangement
          const leftSeats = row.slice(0, 2);
          const rightSeats = row.slice(2);

          return (
            <div key={rowIndex} className="flex justify-center items-center">
              <div className="flex gap-2">
                {leftSeats.map((seatNumber) => (
                  <button
                    key={seatNumber}
                    type="button"
                    disabled={bookedSeats.includes(seatNumber)}
                    onClick={() => handleSeatClick(seatNumber)}
                    className={getSeatClass(seatNumber)}
                  >
                    {seatNumber}
                  </button>
                ))}
              </div>
              <div className="w-8"></div>
              <div className="flex gap-2">
                {rightSeats.map((seatNumber) => (
                  <button
                    key={seatNumber}
                    type="button"
                    disabled={bookedSeats.includes(seatNumber)}
                    onClick={() => handleSeatClick(seatNumber)}
                    className={getSeatClass(seatNumber)}
                  >
                    {seatNumber}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 uppercase tracking-widest text-center mt-5 font-medium">
        Back of Bus
      </p>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mt-5">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mt-5">
          <p className="font-semibold">{success}</p>
          {bookingReference && (
            <p className="text-sm mt-1">
              Booking Reference: <span className="font-bold">{bookingReference}</span>
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
          >
            View My Bookings
          </button>
        </div>
      )}

      {/* Summary Footer */}
      <div className="border-t border-gray-100 mt-6 pt-5">
        <h3 className="text-lg font-bold text-gray-800">Booking Summary</h3>

        <div className="mt-3 flex justify-between text-sm">
          <span className="text-gray-500">Selected Seats</span>
          <span className="font-semibold text-gray-800">
            {selectedSeats.length > 0 ? selectedSeats.slice().sort((a, b) => a - b).join(", ") : "None"}
          </span>
        </div>

        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gray-500">Fare per Seat</span>
          <span className="font-semibold text-gray-800">
            Rs. {Number(fare).toLocaleString()}
          </span>
        </div>

        <div className="mt-3 flex justify-between text-base border-t border-gray-100 pt-3">
          <span className="font-bold text-gray-900">Total Amount</span>
          <span className="font-bold text-gray-900 text-lg">
            Rs. {totalAmount.toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={handleBooking}
          disabled={booking || selectedSeats.length === 0}
          className="w-full mt-5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed py-3 rounded-lg font-semibold text-slate-900 transition"
        >
          {booking ? "Processing Reservation..." : `Book ${selectedSeats.length} Seat${selectedSeats.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}
