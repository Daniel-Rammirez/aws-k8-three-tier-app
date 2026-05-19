import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { flightApi, bookingApi, clearSession, getCurrentUser, Flight, User } from '../lib/api';

export default function Flights() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filtered, setFiltered] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [bookingError, setBookingError] = useState<Record<number, string>>({});
  const [bookingSuccess, setBookingSuccess] = useState<Record<number, boolean>>({});

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    setUser(currentUser);

    flightApi
      .list()
      .then((data) => {
        setFlights(data);
        setFiltered(data);
      })
      .catch(() => setError('Failed to load flights'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    let result = flights;
    if (origin.trim()) {
      result = result.filter((f) =>
        f.origin.toLowerCase().includes(origin.toLowerCase())
      );
    }
    if (destination.trim()) {
      result = result.filter((f) =>
        f.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    if (date) {
      result = result.filter((f) => f.date.startsWith(date));
    }
    setFiltered(result);
  }, [origin, destination, date, flights]);

  const handleBook = async (flightId: number) => {
    if (!user) return;
    setBookingId(flightId);
    setBookingError((prev) => ({ ...prev, [flightId]: '' }));

    try {
      await bookingApi.create(flightId);
      setBookingSuccess((prev) => ({ ...prev, [flightId]: true }));
      setFlights((prev) =>
        prev.map((f) =>
          f.id === flightId ? { ...f, available_seats: f.available_seats - 1 } : f
        )
      );
    } catch (err: unknown) {
      setBookingError((prev) => ({
        ...prev,
        [flightId]: err instanceof Error ? err.message : 'Booking failed',
      }));
    } finally {
      setBookingId(null);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-600">FlightApp</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Hi, <span className="font-medium">{user?.name}</span>
          </span>
          <Link href="/bookings" className="text-sm text-blue-600 hover:underline">
            My Bookings
          </Link>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Flights</h2>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              Origin
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Any city"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Any city"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading && <p className="text-gray-500 text-sm">Loading flights...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading && filtered.length === 0 && (
          <p className="text-gray-500 text-sm">No flights match your search.</p>
        )}

        <div className="space-y-3">
          {filtered.map((flight) => (
            <div
              key={flight.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{flight.origin}</p>
                  <p className="text-xs text-gray-500">Origin</p>
                </div>
                <div className="text-gray-400 text-lg">→</div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{flight.destination}</p>
                  <p className="text-xs text-gray-500">Destination</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div>
                  <span className="text-gray-400 text-xs">Date </span>
                  {new Date(flight.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </div>
                <div>
                  <span className="font-semibold text-gray-900 text-base">
                    ${Number(flight.price).toFixed(2)}
                  </span>
                </div>
                <div className={flight.available_seats === 0 ? 'text-red-500' : 'text-green-600'}>
                  {flight.available_seats} seats left
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {bookingSuccess[flight.id] ? (
                  <span className="text-green-600 text-sm font-medium">Booked!</span>
                ) : (
                  <button
                    onClick={() => handleBook(flight.id)}
                    disabled={flight.available_seats === 0 || bookingId === flight.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    {bookingId === flight.id ? 'Booking...' : 'Book'}
                  </button>
                )}
                {bookingError[flight.id] && (
                  <p className="text-red-500 text-xs">{bookingError[flight.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
