import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function connectWithRetry(
  retries = 6,
  delayMs = 5000,
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("Database connected");
      return;
    } catch (err) {
      console.log(
        `DB connection attempt ${i + 1}/${retries} failed, retrying in ${delayMs / 1000}s...`,
      );
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Could not connect to database after retries");
}

export default pool;
