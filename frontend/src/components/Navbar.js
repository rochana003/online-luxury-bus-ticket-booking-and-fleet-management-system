"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  function loadUser() {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Invalid stored user:", error);

        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }

  useEffect(() => {
    // Read user when Navbar first loads
    loadUser();

    // Update Navbar after login/logout in this tab
    window.addEventListener(
      "authChanged",
      loadUser
    );

    // Update Navbar if login/logout happens
    // in another browser tab
    window.addEventListener(
      "storage",
      loadUser
    );

    return () => {
      window.removeEventListener(
        "authChanged",
        loadUser
      );

      window.removeEventListener(
        "storage",
        loadUser
      );
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    window.dispatchEvent(
      new Event("authChanged")
    );

    router.push("/login");
  }

  return (
    <nav className="bg-slate-900 text-white px-8 py-4">

      <div className="max-w-6xl mx-auto flex items-center justify-between">

        <Link
          href="/"
          className="text-xl font-bold"
        >
          Luxury Bus
        </Link>

        <div className="flex gap-6 items-center">

          <Link
            href="/"
            className="hover:text-yellow-400"
          >
            Home
          </Link>

          {/* Passenger navigation */}
          {user?.role === "passenger" && (
            <Link
              href="/dashboard"
              className="hover:text-yellow-400"
            >
              My Bookings
            </Link>
          )}

          {/* Admin navigation */}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="hover:text-yellow-400"
            >
              Admin
            </Link>
          )}

          {/* Not logged in */}
          {!user ? (
            <>
              <Link
                href="/login"
                className="hover:text-yellow-400"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <span className="text-gray-300">
                {user.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg font-semibold"
              >
                Logout
              </button>
            </>
          )}

        </div>

      </div>

    </nav>
  );
}