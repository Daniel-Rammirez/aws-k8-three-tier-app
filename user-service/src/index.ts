import express from 'express';
import cors from 'cors';
import { connectWithRetry } from './db';
import usersRouter from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', usersRouter);

async function start() {
  await connectWithRetry();
  app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
  });
}

start().catch(console.error);
