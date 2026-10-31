import Link from "next/link";
import { notFound } from "next/navigation";
import SeatLayout from "@/components/SeatLayout";

export default async function JourneyDetailsPage({ params }) {
  const { id } = await params;

  let schedule;

  try {
    const response = await fetch(`http://localhost:5000/api/schedules/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      notFound();
    }

    const data = await response.json();
    schedule = data.schedule;
  } catch (error) {
    console.error("Schedule fetch error:", error);
    notFound();
  }

  const departure = new Date(schedule.departureTime);
  const arrival = new Date(schedule.arrivalTime);

  const formatTime = (date) =>
    date.toLocaleTimeString("en-LK", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-slate-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/search"
            className="text-yellow-400 hover:text-yellow-300 text-sm font-medium mb-3 inline-block"
          >
            ← Back to Search
          </Link>
          <h1 className="text-3xl font-bold">
            {schedule.bus.model || schedule.bus.name || "Luxury Coach"}
          </h1>
          <p className="text-gray-300 mt-2">
            {schedule.route.origin} → {schedule.route.destination} • {schedule.bus.registrationNumber}
          </p>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Journey Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Departure</p>
              <p className="font-semibold">{formatTime(departure)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Arrival</p>
              <p className="font-semibold">{formatTime(arrival)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Bus Model</p>
              <p className="font-semibold">{schedule.bus.model}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Fare per Seat</p>
              <p className="font-semibold">Rs. {schedule.fare.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <SeatLayout scheduleId={id} fare={schedule.fare} />
        </div>
      </section>
    </main>
  );
}
