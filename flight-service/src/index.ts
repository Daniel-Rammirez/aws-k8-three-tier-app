import express from 'express';
import cors from 'cors';
import { connectWithRetry } from './db';
import { seedFlights } from './seed';
import flightsRouter from './routes/flights';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/flights', flightsRouter);

async function start() {
  await connectWithRetry();
  await seedFlights();
  app.listen(PORT, () => {
    console.log(`Flight service running on port ${PORT}`);
  });
}

start().catch(console.error);
