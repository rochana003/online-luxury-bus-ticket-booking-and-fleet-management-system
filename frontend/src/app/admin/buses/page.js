"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ManageBusesPage() {
  const router = useRouter();

  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    async function initializePage() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const adminResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
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

        await loadBuses();
      } catch (err) {
        console.error("Manage buses error:", err);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [router]);

  function logoutAndRedirect() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChanged"));
    router.replace("/login");
  }

  async function loadBuses() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buses`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to load buses.");
        return;
      }

      setBuses(data.buses || []);
    } catch (err) {
      console.error("Load buses error:", err);
      setError("Unable to load buses.");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalSeats" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.registrationNumber || !formData.model || !formData.type) {
      setError("Please complete all required fields.");
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

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

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
        setError(data.message || "Unable to save bus.");
        return;
      }

      setSuccess(isEditing ? "Bus updated successfully." : "Bus added successfully.");
      resetForm();
      await loadBuses();
    } catch (err) {
      console.error("Save bus error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(bus) {
    setEditingId(bus._id);
    setFormData({
      registrationNumber: bus.registrationNumber,
      model: bus.model,
      type: bus.type,
      totalSeats: bus.totalSeats,
      status: bus.status,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setFormData({
      registrationNumber: "",
      model: "",
      type: "",
      totalSeats: 51,
      status: "active",
    });
  }

  async function deleteBus(busId) {
    const confirmed = window.confirm("Are you sure you want to delete this bus?");
    if (!confirmed) return;

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
          headers: { Authorization: `Bearer ${token}` },
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
        setError(data.message || "Unable to delete bus.");
        return;
      }

      setSuccess("Bus deleted successfully.");
      await loadBuses();
    } catch (err) {
      console.error("Delete bus error:", err);
      setError("Unable to connect to the server.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading buses...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <section className="bg-slate-900 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">Manage Buses</h1>
          <p className="text-gray-300 mt-1">Add, update and remove fleet vehicles.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        {/* Bus Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingId ? "Edit Bus" : "Add New Bus"}
          </h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="NB-1234"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Yutong C12 Pro"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Luxury Air-Conditioned Coach"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Seats</label>
              <input
                type="number"
                name="totalSeats"
                min="1"
                value={formData.totalSeats}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-300 text-slate-900 px-6 py-3 rounded-lg font-semibold transition"
              >
                {submitting ? "Saving..." : editingId ? "Update Bus" : "Add Bus"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bus List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Bus Fleet ({buses.length})</h2>

          {buses.length === 0 ? (
            <p className="text-gray-500">No buses have been added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px] text-sm">
                <thead className="border-b border-gray-200 text-gray-500 font-medium">
                  <tr>
                    <th className="py-3 pr-4">Registration</th>
                    <th className="py-3 pr-4">Model</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Seats</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {buses.map((bus) => (
                    <tr key={bus._id} className="hover:bg-gray-50 transition">
                      <td className="py-4 pr-4 font-semibold text-gray-800">{bus.registrationNumber}</td>
                      <td className="py-4 pr-4 text-gray-700">{bus.model}</td>
                      <td className="py-4 pr-4 text-gray-600">{bus.type}</td>
                      <td className="py-4 pr-4 text-gray-700 font-medium">{bus.totalSeats}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={
                            bus.status === "active"
                              ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold"
                              : "bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold"
                          }
                        >
                          {bus.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(bus)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md font-medium transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBus(bus._id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-md font-medium transition"
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
