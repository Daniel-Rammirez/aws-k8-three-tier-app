import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM flights ORDER BY date ASC, origin ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid flight ID' });
    return;
  }
  try {
    const result = await pool.query('SELECT * FROM flights WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/seats', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid flight ID' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE flights
       SET available_seats = available_seats - 1
       WHERE id = $1 AND available_seats > 0
       RETURNING id, available_seats`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Flight not found or no seats available' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
