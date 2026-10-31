import Link from "next/link";

export default function BusCard({ journey }) {
  const departure = new Date(journey.departureTime);
  const arrival = new Date(journey.arrivalTime);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-LK", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {journey.bus.model || journey.bus.name || "Luxury Coach"}
          </h2>
          <p className="text-gray-600 mt-1">
            {journey.route.origin} → {journey.route.destination}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {formatTime(departure)} – {formatTime(arrival)}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {journey.bus.type}
            </span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {journey.bus.registrationNumber}
            </span>
          </div>
        </div>

        <div className="text-left md:text-right">
          <p className="text-xl font-bold text-gray-900">
            Rs. {journey.fare.toLocaleString()}
          </p>
          <p className="text-green-600 text-sm mt-1 font-medium">
            {journey.availableSeats} seats available
          </p>
          <Link
            href={`/journey/${journey.id}`}
            className="inline-block mt-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-5 py-2 rounded-lg font-semibold transition"
          >
            Select Bus
          </Link>
        </div>
      </div>
    </div>
  );
}
