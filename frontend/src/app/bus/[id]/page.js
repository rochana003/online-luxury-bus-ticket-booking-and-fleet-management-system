import Link from "next/link";
import { notFound } from "next/navigation";
import { buses } from "@/data/buses";
import SeatLayout from "@/components/SeatLayout";

export default async function BusDetailsPage({ params }) {
  const { id } = await params;

  const bus = buses.find(
    (bus) => bus.id === Number(id)
  );

  if (!bus) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <div className="bg-slate-900 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">

          <Link
            href="/search"
            className="text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Search Results
          </Link>

          <h1 className="text-3xl font-bold mt-5">
            {bus.name}
          </h1>

          <p className="text-gray-300 mt-2">
            {bus.origin} → {bus.destination}
          </p>

        </div>
      </div>

      <section className="max-w-5xl mx-auto px-6 py-10">

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
                {bus.departure}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Arrival
              </p>

              <p className="font-semibold">
                {bus.arrival}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Bus Type
              </p>

              <p className="font-semibold">
                {bus.type}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Fare
              </p>

              <p className="font-semibold">
                Rs. {bus.fare.toLocaleString()}
              </p>
            </div>

          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500">
              Available Seats
            </p>

            <p className="text-green-600 font-semibold">
              {bus.availableSeats} seats available
            </p>
          </div>

        </div>

        <div className="mt-8">
            <SeatLayout fare={bus.fare} />
        </div>

      </section>

    </main>
  );
}