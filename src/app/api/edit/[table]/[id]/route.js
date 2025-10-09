import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});



// OPTIONAL: whitelist tables to prevent SQL injection
const ALLOWED_TABLES = ["drivers", "trucks", "trailers"]; 

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { table, id } = await params;
    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: "Table not allowed" }, 400);
    }

    const data = await request.json();
    const keys = Object.keys(data);

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, 400);
    }

    if (keys.length === 0) {
      return NextResponse.json({ error: "No fields provided for update" }, 400);
    }

    // Build dynamic query
    const setClauses = [];
    const values = [];
    let index = 1;

    for (const key of keys) {
      setClauses.push(`${key} = $${index++}`);
      values.push(data[key]);
    }

    values.push(id); // last param for WHERE

    const queryText = `
      UPDATE ${table}
      SET ${setClauses.join(", ")}
      WHERE id = $${index}
      RETURNING *;
    `;

    const result = await client.query(queryText, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Record not found" }, 404);
    }

    return NextResponse.json({ success: true, record: result.rows[0] }, 200);
  } catch (error) {
    return NextResponse.json({ error: error.message }, 500);
  } finally {
    client.release();
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, 200);
}
