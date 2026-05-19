import pool from './db';

const SAMPLE_FLIGHTS = [
  { origin: 'New York', destination: 'Los Angeles', date: '2025-08-01', price: 299.99, total_seats: 150 },
  { origin: 'Los Angeles', destination: 'Chicago', date: '2025-08-02', price: 199.99, total_seats: 120 },
  { origin: 'Chicago', destination: 'Miami', date: '2025-08-03', price: 249.99, total_seats: 100 },
  { origin: 'Miami', destination: 'Seattle', date: '2025-08-04', price: 349.99, total_seats: 80 },
  { origin: 'Seattle', destination: 'Boston', date: '2025-08-05', price: 279.99, total_seats: 90 },
  { origin: 'Boston', destination: 'Denver', date: '2025-08-06', price: 189.99, total_seats: 110 },
  { origin: 'Denver', destination: 'Phoenix', date: '2025-08-07', price: 149.99, total_seats: 130 },
  { origin: 'Phoenix', destination: 'Atlanta', date: '2025-08-08', price: 229.99, total_seats: 140 },
  { origin: 'Atlanta', destination: 'New York', date: '2025-08-09', price: 219.99, total_seats: 160 },
  { origin: 'San Francisco', destination: 'Dallas', date: '2025-08-10', price: 259.99, total_seats: 120 },
  { origin: 'Dallas', destination: 'Las Vegas', date: '2025-08-11', price: 179.99, total_seats: 100 },
  { origin: 'Las Vegas', destination: 'Portland', date: '2025-08-12', price: 199.99, total_seats: 90 },
];

export async function seedFlights(): Promise<void> {
  const { rows } = await pool.query('SELECT COUNT(*) FROM flights');
  if (parseInt(rows[0].count, 10) > 0) {
    console.log('Flights already seeded, skipping');
    return;
  }
  for (const f of SAMPLE_FLIGHTS) {
    await pool.query(
      'INSERT INTO flights (origin, destination, date, price, total_seats, available_seats) VALUES ($1,$2,$3,$4,$5,$5)',
      [f.origin, f.destination, f.date, f.price, f.total_seats]
    );
  }
  console.log(`Seeded ${SAMPLE_FLIGHTS.length} flights`);
}
