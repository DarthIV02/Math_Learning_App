const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

const useDbSsl = process.env.DB_SSL === "true";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useDbSsl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected DB error", err);
});

module.exports = pool;