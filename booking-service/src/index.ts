import express from 'express';
import cors from 'cors';
import { connectWithRetry } from './db';
import bookingsRouter from './routes/bookings';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/bookings', bookingsRouter);

async function start() {
  await connectWithRetry();
  app.listen(PORT, () => {
    console.log(`Booking service running on port ${PORT}`);
  });
}

start().catch(console.error);
