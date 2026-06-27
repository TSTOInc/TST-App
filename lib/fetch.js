// lib/getTrucks.js
import { auth } from "@clerk/nextjs/server";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function getTable(table) {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await pool.query(`SELECT * FROM ${table};`);
    return result.rows;
  } catch (err) {
    console.error("Error fetching trucks:", err);
    throw new Error(err.message || "Unknown error");
  }
}
