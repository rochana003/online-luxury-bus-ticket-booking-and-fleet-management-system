"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Login failed"
        );

        return;
      }

      // Save JWT
      localStorage.setItem(
        "token",
        data.token
      );

      // Save basic user information
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Tell Navbar that authentication changed
      window.dispatchEvent(
        new Event("authChanged")
      );

      // Redirect depending on role
      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

    } catch (error) {
      console.error(
        "Login error:",
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
          Login
        </h1>

        <p className="text-gray-500 text-center mt-2">
          Sign in to your account
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

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
              placeholder="Enter your password"
            />

          </div>


          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
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
              ? "Logging in..."
              : "Login"}
          </button>

        </form>


        <p className="text-center text-gray-500 mt-6">

          Don't have an account?{" "}

          <Link
            href="/register"
            className="text-yellow-600 font-semibold"
          >
            Register
          </Link>

        </p>

      </div>

    </main>
  );
}