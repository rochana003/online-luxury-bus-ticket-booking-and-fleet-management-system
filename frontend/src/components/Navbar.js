"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function loadUser() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Invalid user JSON in storage:", error);
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }

  useEffect(() => {
    loadUser();

    window.addEventListener("authChanged", loadUser);
    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("authChanged", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);

    window.dispatchEvent(new Event("authChanged"));
    router.push("/login");
  }

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-50 shadow">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          onClick={closeMenu}
          className="text-xl font-bold tracking-tight text-white hover:text-yellow-400 transition"
        >
          Luxury Bus
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-300 hover:text-yellow-400 transition">
            Home
          </Link>

          {user?.role === "passenger" && (
            <Link href="/dashboard" className="text-gray-300 hover:text-yellow-400 transition">
              My Bookings
            </Link>
          )}

          {user?.role === "admin" && (
            <Link href="/admin" className="text-gray-300 hover:text-yellow-400 transition">
              Admin
            </Link>
          )}

          {!user ? (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-300 hover:text-yellow-400 transition px-2 py-1">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">{user.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3.5 py-1.5 rounded-lg font-medium transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden mt-4 border-t border-gray-800 pt-4 pb-2 flex flex-col gap-3">
          <Link href="/" onClick={closeMenu} className="hover:text-yellow-400 py-1">
            Home
          </Link>

          {user?.role === "passenger" && (
            <Link href="/dashboard" onClick={closeMenu} className="hover:text-yellow-400 py-1">
              My Bookings
            </Link>
          )}

          {user?.role === "admin" && (
            <Link href="/admin" onClick={closeMenu} className="hover:text-yellow-400 py-1">
              Admin Dashboard
            </Link>
          )}

          {!user ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
              <Link href="/login" onClick={closeMenu} className="hover:text-yellow-400 py-1">
                Login
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg text-center font-semibold"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-800 flex flex-col gap-2">
              <p className="text-xs text-gray-400">Logged in as {user.name}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-left"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
