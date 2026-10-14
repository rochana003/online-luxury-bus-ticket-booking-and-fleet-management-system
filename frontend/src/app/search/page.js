import BusCard from "@/components/BusCard";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;

  const from = params.from || "";
  const to = params.to || "";
  const date = params.date || "";

  let journeys = [];
  let error = "";

  try {
    const query = new URLSearchParams({
      from,
      to,
      date,
    });

    const response = await fetch(
      `http://localhost:5000/api/journeys/search?${query.toString()}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      error = data.message || "Failed to search journeys";
    } else {
      journeys = data.journeys || [];
    }

  } catch (err) {
    console.error("Journey search error:", err);

    error =
      "Unable to connect to the backend server.";
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-slate-900 text-white py-10 px-6">

        <div className="max-w-5xl mx-auto">

          <h1 className="text-3xl font-bold">
            Available Buses
          </h1>

          <p className="text-gray-300 mt-2">
            {from} → {to}
          </p>

          <p className="text-gray-400 mt-1">
            Travel Date: {date}
          </p>

        </div>

      </div>


      {/* Results */}
      <section className="max-w-5xl mx-auto px-6 py-10">

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}


        {/* No journeys */}
        {!error && journeys.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">

            <h2 className="text-xl font-semibold">
              No buses found
            </h2>

            <p className="text-gray-500 mt-2">
              Try another route or travel date.
            </p>

          </div>
        )}


        {/* Journey cards */}
        {!error && journeys.length > 0 && (
          <div className="space-y-5">

            {journeys.map((journey) => (
              <BusCard
                key={journey.id}
                journey={journey}
              />
            ))}

          </div>
        )}

      </section>

    </main>
  );
}