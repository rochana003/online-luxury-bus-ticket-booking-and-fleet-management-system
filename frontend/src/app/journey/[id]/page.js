import { notFound } from "next/navigation";
import SeatLayout from "@/components/SeatLayout";

export default async function JourneyDetailsPage({
  params,
}) {
  const { id } = await params;

  let schedule;

  try {
    const response = await fetch(
      `http://localhost:5000/api/schedules/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      notFound();
    }

    const data = await response.json();

    schedule = data.schedule;

  } catch (error) {
    console.error(
      "Schedule fetch error:",
      error
    );

    notFound();
  }

  const departure = new Date(
    schedule.departureTime
  );

  const arrival = new Date(
    schedule.arrivalTime
  );

  const formatTime = (date) =>
    date.toLocaleTimeString(
      "en-LK",
      {
        timeZone: "Asia/Colombo",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Journey header */}
      <div className="bg-slate-900 text-white py-10 px-6">

        <div className="max-w-5xl mx-auto">

          <h1 className="text-3xl font-bold">
            {schedule.bus.name}
          </h1>

          <p className="text-gray-300 mt-2">
            {schedule.route.origin}
            {" → "}
            {schedule.route.destination}
          </p>

        </div>

      </div>


      <section className="max-w-5xl mx-auto px-6 py-10">

        {/* Journey details */}
        <div className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-2xl font-bold mb-6">
            Journey Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <div>
              <p className="text-sm text-gray-500">
                Departure
              </p>

              <p className="font-semibold">
                {formatTime(departure)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Arrival
              </p>

              <p className="font-semibold">
                {formatTime(arrival)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Bus
              </p>

              <p className="font-semibold">
                {schedule.bus.model}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Fare
              </p>

              <p className="font-semibold">
                Rs. {schedule.fare.toLocaleString()}
              </p>
            </div>

          </div>

        </div>


        {/* Seat selection */}
        <div className="mt-8">

          <SeatLayout
            fare={schedule.fare}
          />

        </div>

      </section>

    </main>
  );
}