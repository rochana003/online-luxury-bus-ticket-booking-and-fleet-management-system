"use client";

import { useState } from "react";

export default function SeatLayout({ fare }) {
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Seat arrangement based on your reference layout
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

    // Two seats only on the left side
    [45, 46],

    // Last row with seat 51 in the middle
    [49, 50, 51, 48, 47],
  ];

  // Temporary unavailable seats for Phase 2
  const unavailableSeats = [3, 7, 14, 18];

  function handleSeatClick(seat) {
    if (unavailableSeats.includes(seat)) {
      return;
    }

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(
        selectedSeats.filter(
          (selectedSeat) => selectedSeat !== seat
        )
      );
    } else {
      setSelectedSeats([
        ...selectedSeats,
        seat,
      ]);
    }
  }

  function getSeatClass(seat) {
    const unavailable =
      unavailableSeats.includes(seat);

    const selected =
      selectedSeats.includes(seat);

    if (unavailable) {
      return "bg-gray-500 text-white cursor-not-allowed";
    }

    if (selected) {
      return "bg-yellow-500 text-black";
    }

    return "bg-gray-200 hover:bg-gray-300";
  }

  const totalPrice =
    selectedSeats.length * fare;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-2xl font-bold mb-6">
        Select Your Seats
      </h2>

      {/* Seat status guide */}
      <div className="flex flex-wrap gap-6 mb-6 text-sm">

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <span>Available</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-500 rounded"></div>
          <span>Selected</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-500 rounded"></div>
          <span>Unavailable</span>
        </div>

      </div>

      {/* Bus layout */}
      <div className="max-w-md mx-auto border-2 border-gray-300 rounded-xl p-6">

        <p className="text-center text-xs text-gray-400 mb-3">
          FRONT
        </p>

        {/* Driver */}
        <div className="flex justify-end mb-8">
          <div className="bg-slate-800 text-white px-4 py-2 rounded-lg">
            Driver
          </div>
        </div>

        {/* Seat rows */}
        <div className="space-y-4">

          {seatRows.map((row, rowIndex) => {

            // Last row - 5 seats
            if (row.length === 5) {
              return (
                <div
                  key={rowIndex}
                  className="flex justify-center gap-3"
                >
                  {row.map((seat) => (
                    <button
                      key={seat}
                      type="button"
                      disabled={unavailableSeats.includes(seat)}
                      onClick={() => handleSeatClick(seat)}
                      className={`
                        w-12 h-12
                        rounded-lg
                        font-semibold
                        transition
                        ${getSeatClass(seat)}
                      `}
                    >
                      {seat}
                    </button>
                  ))}
                </div>
              );
            }

            // Special row - seats 45 and 46 only
            if (row.length === 2) {
              return (
                <div
                  key={rowIndex}
                  className="flex justify-center items-center"
                >
                  {/* Empty left side - keeps alignment */}
                <div className="w-[108px]"></div>

                {/* Aisle */}
                <div className="w-10"></div>

                {/* Right side - seats 45 and 46 */}
                <div className="flex gap-3">

                    {row.map((seat) => (
                      <button
                        key={seat}
                        type="button"
                        disabled={unavailableSeats.includes(seat)}
                        onClick={() => handleSeatClick(seat)}
                        className={`
                          w-12 h-12
                          rounded-lg
                          font-semibold
                          transition
                          ${getSeatClass(seat)}
                        `}
                      >
                        {seat}
                      </button>
                    ))}

                  </div>
                </div>
              );
            }

            // Normal rows - 2 seats + aisle + 2 seats
            return (
              <div
                key={rowIndex}
                className="flex justify-center items-center"
              >

                {/* Left side */}
                <div className="flex gap-3">

                  {row.slice(0, 2).map((seat) => (
                    <button
                      key={seat}
                      type="button"
                      disabled={unavailableSeats.includes(seat)}
                      onClick={() => handleSeatClick(seat)}
                      className={`
                        w-12 h-12
                        rounded-lg
                        font-semibold
                        transition
                        ${getSeatClass(seat)}
                      `}
                    >
                      {seat}
                    </button>
                  ))}

                </div>

                {/* Aisle */}
                <div className="w-10"></div>

                {/* Right side */}
                <div className="flex gap-3">

                  {row.slice(2).map((seat) => (
                    <button
                      key={seat}
                      type="button"
                      disabled={unavailableSeats.includes(seat)}
                      onClick={() => handleSeatClick(seat)}
                      className={`
                        w-12 h-12
                        rounded-lg
                        font-semibold
                        transition
                        ${getSeatClass(seat)}
                      `}
                    >
                      {seat}
                    </button>
                  ))}

                </div>

              </div>
            );
          })}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          BACK
        </p>

      </div>

      {/* Booking summary */}
      <div className="border-t mt-8 pt-6">

        <p className="text-gray-500">
          Selected Seats
        </p>

        <p className="font-semibold mt-1">
          {selectedSeats.length > 0
            ? [...selectedSeats]
                .sort((a, b) => a - b)
                .join(", ")
            : "No seats selected"}
        </p>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 mt-6">

          <div>
            <p className="text-gray-500">
              Total Price
            </p>

            <p className="text-2xl font-bold">
              Rs. {totalPrice.toLocaleString()}
            </p>
          </div>

          <button
            type="button"
            disabled={selectedSeats.length === 0}
            className="
              bg-yellow-500
              hover:bg-yellow-400
              disabled:bg-gray-300
              disabled:text-gray-500
              disabled:cursor-not-allowed
              px-6
              py-3
              rounded-lg
              font-semibold
              transition
            "
          >
            Continue Booking
          </button>

        </div>

      </div>

    </div>
  );
}