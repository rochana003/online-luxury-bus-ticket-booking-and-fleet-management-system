import Link from "next/link";

export default function BusCard({ journey }) {

  const departure = new Date(
    journey.departureTime
  );

  const arrival = new Date(
    journey.arrivalTime
  );

  const formatTime = (date) => {
    return date.toLocaleTimeString(
      "en-LK",
      {
        timeZone: "Asia/Colombo",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        {/* Bus information */}
        <div>

          <h2 className="text-xl font-bold text-gray-800">
            {journey.bus.name}
          </h2>

          <p className="text-gray-600 mt-2">
            {journey.route.origin}
            {" → "}
            {journey.route.destination}
          </p>

          <p className="text-gray-500 mt-1">
            {formatTime(departure)}
            {" - "}
            {formatTime(arrival)}
          </p>

          <p className="text-sm text-gray-500 mt-2">
            {journey.bus.type}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            {journey.bus.model}
          </p>

        </div>


        {/* Fare and selection */}
        <div className="text-left md:text-right">

          <p className="text-lg font-bold text-gray-800">
            Rs. {journey.fare.toLocaleString()}
          </p>

          <p className="text-green-600 text-sm mt-1">
            {journey.availableSeats} seats available
          </p>

          <Link
            href={`/journey/${journey.id}`}
            className="inline-block mt-4 bg-yellow-500 hover:bg-yellow-400 px-5 py-2 rounded-lg font-semibold"
          >
            Select Bus
          </Link>

        </div>

      </div>

    </div>
  );
}