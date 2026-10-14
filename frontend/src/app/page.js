import BusSearch from "@/components/BusSearch";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">


      <section className="bg-slate-800 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Travel Sri Lanka in Comfort
          </h1>

          <p className="text-lg text-gray-300 mb-10">
            Search and book luxury bus tickets quickly and easily.
          </p>

          <BusSearch />

        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold text-center mb-10">
            Why Travel With Us?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-2">
                Luxury Coaches
              </h3>
              <p className="text-gray-600">
                Travel comfortably with modern air-conditioned buses.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-2">
                Easy Booking
              </h3>
              <p className="text-gray-600">
                Search routes and reserve your preferred seat online.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-2">
                Convenient Routes
              </h3>
              <p className="text-gray-600">
                Travel between major destinations across Sri Lanka.
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}