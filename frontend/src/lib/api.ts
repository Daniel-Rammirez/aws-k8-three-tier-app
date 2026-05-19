const USER_SERVICE_URL =
  process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3001';
const FLIGHT_SERVICE_URL =
  process.env.NEXT_PUBLIC_FLIGHT_SERVICE_URL || 'http://localhost:3002';
const BOOKING_SERVICE_URL =
  process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || 'http://localhost:3003';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export const userApi = {
  login: (email: string, password: string): Promise<AuthResult> =>
    fetch(`${USER_SERVICE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((r) => handleResponse<AuthResult>(r)),

  register: (name: string, email: string, password: string): Promise<AuthResult> =>
    fetch(`${USER_SERVICE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then((r) => handleResponse<AuthResult>(r)),
};

export interface Flight {
  id: number;
  origin: string;
  destination: string;
  date: string;
  price: number;
  total_seats: number;
  available_seats: number;
}

export const flightApi = {
  list: (): Promise<Flight[]> =>
    fetch(`${FLIGHT_SERVICE_URL}/flights`).then((r) => handleResponse<Flight[]>(r)),
};

export interface Booking {
  id: number;
  user_id: number;
  flight_id: number;
  booked_at: string;
  status: string;
  flight?: Flight;
}

export const bookingApi = {
  create: (flightId: number): Promise<Booking> =>
    fetch(`${BOOKING_SERVICE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ flightId }),
    }).then((r) => handleResponse<Booking>(r)),

  listForUser: (userId: number): Promise<Booking[]> =>
    fetch(`${BOOKING_SERVICE_URL}/bookings/user/${userId}`, {
      headers: { ...authHeaders() },
    }).then((r) => handleResponse<Booking[]>(r)),
};

export function saveSession(token: string, user: User): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as User) : null;
}
