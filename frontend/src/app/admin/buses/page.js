"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ManageBusesPage() {
  const router = useRouter();

  const [buses, setBuses] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    registrationNumber: "",
    model: "",
    type: "",
    totalSeats: 51,
    status: "active",
  });

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // Check admin authentication and load buses
  useEffect(() => {
    async function initializePage() {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // Verify admin
        const adminResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (adminResponse.status === 401) {
          logoutAndRedirect();
          return;
        }

        if (adminResponse.status === 403) {
          router.replace("/dashboard");
          return;
        }

        if (!adminResponse.ok) {
          setError("Unable to verify administrator.");
          return;
        }

        // Load buses
        await loadBuses();

      } catch (error) {
        console.error("Manage buses error:", error);

        setError(
          "Unable to connect to the server."
        );

      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [router]);


  function logoutAndRedirect() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.dispatchEvent(
      new Event("authChanged")
    );

    router.replace("/login");
  }


  async function loadBuses() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/buses`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to load buses."
        );

        return;
      }

      setBuses(data.buses || []);

    } catch (error) {
      console.error(
        "Load buses error:",
        error
      );

      setError(
        "Unable to load buses."
      );
    }
  }


  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        name === "totalSeats"
          ? Number(value)
          : value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.name ||
      !formData.registrationNumber ||
      !formData.model ||
      !formData.type
    ) {
      setError(
        "Please complete all required fields."
      );

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setSubmitting(true);

      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/buses/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/buses`;

      const response = await fetch(
        url,
        {
          method: isEditing
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (response.status === 403) {
        setError("Admin access required.");
        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to save bus."
        );

        return;
      }

      setSuccess(
        isEditing
          ? "Bus updated successfully."
          : "Bus added successfully."
      );

      resetForm();

      await loadBuses();

    } catch (error) {
      console.error(
        "Save bus error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );

    } finally {
      setSubmitting(false);
    }
  }


  function startEditing(bus) {
    setEditingId(bus._id);

    setFormData({
      name: bus.name,
      registrationNumber:
        bus.registrationNumber,
      model: bus.model,
      type: bus.type,
      totalSeats: bus.totalSeats,
      status: bus.status,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function resetForm() {
    setEditingId(null);

    setFormData({
      name: "",
      registrationNumber: "",
      model: "",
      type: "",
      totalSeats: 51,
      status: "active",
    });
  }


  async function deleteBus(busId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this bus?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/buses/${busId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (response.status === 403) {
        setError("Admin access required.");
        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to delete bus."
        );

        return;
      }

      setSuccess(
        "Bus deleted successfully."
      );

      await loadBuses();

    } catch (error) {
      console.error(
        "Delete bus error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    }
  }


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Loading buses...
        </p>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <section className="bg-slate-900 text-white py-10 px-6">

        <div className="max-w-6xl mx-auto">

          <Link
            href="/admin"
            className="text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Admin Dashboard
          </Link>

          <h1 className="text-3xl font-bold mt-5">
            Manage Buses
          </h1>

          <p className="text-gray-300 mt-2">
            Add, update and remove buses.
          </p>

        </div>

      </section>


      <section className="max-w-6xl mx-auto px-6 py-10">

        {/* Bus form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-10">

          <h2 className="text-2xl font-bold mb-6">
            {editingId
              ? "Edit Bus"
              : "Add New Bus"}
          </h2>


          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}


          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
              {success}
            </div>
          )}


          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            {/* Bus name */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Bus Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Luxury Express"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Registration */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Registration Number
              </label>

              <input
                type="text"
                name="registrationNumber"
                value={
                  formData.registrationNumber
                }
                onChange={handleChange}
                placeholder="NB-1234"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Model */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Model
              </label>

              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Yutong C12 Pro"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Type */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Bus Type
              </label>

              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Luxury Air-Conditioned Coach"
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Seats */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Total Seats
              </label>

              <input
                type="number"
                name="totalSeats"
                min="1"
                value={formData.totalSeats}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3"
              />

            </div>


            {/* Status */}
            <div>

              <label className="block text-sm font-medium mb-2">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3"
              >

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

            </div>


            {/* Buttons */}
            <div className="md:col-span-2 flex gap-4">

              <button
                type="submit"
                disabled={submitting}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-300 px-6 py-3 rounded-lg font-semibold"
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Update Bus"
                  : "Add Bus"}
              </button>


              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </div>


        {/* Bus list */}
        <div className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-2xl font-bold mb-6">
            Bus List
          </h2>


          {buses.length === 0 ? (

            <p className="text-gray-500">
              No buses have been added yet.
            </p>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="border-b">

                  <tr>
                    <th className="py-3 pr-4">
                      Name
                    </th>

                    <th className="py-3 pr-4">
                      Registration
                    </th>

                    <th className="py-3 pr-4">
                      Model
                    </th>

                    <th className="py-3 pr-4">
                      Seats
                    </th>

                    <th className="py-3 pr-4">
                      Status
                    </th>

                    <th className="py-3">
                      Actions
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {buses.map((bus) => (

                    <tr
                      key={bus._id}
                      className="border-b"
                    >

                      <td className="py-4 pr-4 font-semibold">
                        {bus.name}
                      </td>

                      <td className="py-4 pr-4">
                        {bus.registrationNumber}
                      </td>

                      <td className="py-4 pr-4">
                        {bus.model}
                      </td>

                      <td className="py-4 pr-4">
                        {bus.totalSeats}
                      </td>

                      <td className="py-4 pr-4">

                        <span
                          className={
                            bus.status === "active"
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {bus.status}
                        </span>

                      </td>

                      <td className="py-4">

                        <div className="flex gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(bus)
                            }
                            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg"
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              deleteBus(bus._id)
                            }
                            className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}