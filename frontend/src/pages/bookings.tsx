import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  bookingApi,
  clearSession,
  getCurrentUser,
  Booking,
  User,
} from "../lib/api";

export default function Bookings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    setUser(currentUser);

    bookingApi
      .listForUser(currentUser.id)
      .then((data) => setBookings(data))
      .catch(() => setError("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-600">FlightApp</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Hi, <span className="font-medium">{user?.name}</span>
          </span>
          <Link
            href="/flights"
            className="text-sm text-blue-600 hover:underline"
          >
            Search Flights
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          My Bookings
        </h2>

        {loading && (
          <p className="text-gray-500 text-sm">Loading bookings...</p>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading && bookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">You have no bookings yet.</p>
            <Link
              href="/flights"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Search for flights
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  {booking.flight ? (
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800">
                        {booking.flight.origin}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-semibold text-gray-800">
                        {booking.flight.destination}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      Flight #{booking.flight_id}
                    </span>
                  )}

                  {booking.flight && (
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(booking.flight.date).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        },
                      )}{" "}
                      &bull; ${Number(booking.flight.price).toFixed(2)}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    Booked on{" "}
                    {new Date(booking.booked_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
