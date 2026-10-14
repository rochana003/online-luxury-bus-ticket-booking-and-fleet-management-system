"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Registration failed"
        );

        return;
      }

      setSuccess(
        "Registration successful. Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6 py-12">

      <div className="bg-white w-full max-w-md rounded-xl shadow-md p-8">

        <h1 className="text-3xl font-bold text-center">
          Create Account
        </h1>

        <p className="text-gray-500 text-center mt-2">
          Register to book your journey
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="block text-sm font-medium mb-2">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="Enter your name"
            />
          </div>


          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="Enter your email"
            />
          </div>


          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="Minimum 6 characters"
            />
          </div>


          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}


          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              bg-yellow-500
              hover:bg-yellow-400
              disabled:bg-gray-300
              disabled:cursor-not-allowed
              p-3
              rounded-lg
              font-semibold
            "
          >
            {loading
              ? "Registering..."
              : "Register"}
          </button>

        </form>


        <p className="text-center text-gray-500 mt-6">

          Already have an account?{" "}

          <Link
            href="/login"
            className="text-yellow-600 font-semibold"
          >
            Login
          </Link>

        </p>

      </div>

    </main>
  );
}