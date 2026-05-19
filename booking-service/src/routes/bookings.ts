import { Router, Response } from 'express';
import axios, { AxiosError } from 'axios';
import pool from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const FLIGHT_SERVICE_URL = process.env.FLIGHT_SERVICE_URL || 'http://localhost:3002';

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { flightId } = req.body;
  const userId = req.userId!;

  if (!flightId) {
    res.status(400).json({ error: 'flightId is required' });
    return;
  }

  try {
    const flightRes = await axios.get(`${FLIGHT_SERVICE_URL}/flights/${flightId}`);
    const flight = flightRes.data;

    if (flight.available_seats <= 0) {
      res.status(400).json({ error: 'No seats available on this flight' });
      return;
    }

    await axios.put(`${FLIGHT_SERVICE_URL}/flights/${flightId}/seats`);

    const result = await pool.query(
      'INSERT INTO bookings (user_id, flight_id, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, flightId, 'confirmed']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 404) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  if (req.userId !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE user_id = $1 ORDER BY booked_at DESC',
      [userId]
    );

    const bookings = await Promise.all(
      result.rows.map(async (booking) => {
        try {
          const flightRes = await axios.get(`${FLIGHT_SERVICE_URL}/flights/${booking.flight_id}`);
          return { ...booking, flight: flightRes.data };
        } catch {
          return { ...booking, flight: null };
        }
      })
    );

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
