import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});



// Handle POST
export async function POST(request) {
  const client = await pool.connect();
  try {
    const data = await request.json();
    const {
      name,
      phone,
      email,
      position,
      broker_id
    } = data;

    if (!name || !broker_id) {
      return NextResponse.json({ error: "Missing required fields" }, 400);
    }

    const insertText = `
      INSERT INTO brokers_agents (name, phone, email, position, broker_id)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
    `;
    const resQuery = await client.query(insertText, [
      name,
      phone || null,
      email || null,
      position || null,
      broker_id
    ]);

    const brokerAgentId = resQuery.rows[0].id;
    return NextResponse.json({ success: true, broker_agent_id: brokerAgentId }, 201);
  } catch (err) {
    return NextResponse.json({ error: err.message }, 500);
  } finally {
    client.release();
  }
}

// Handle OPTIONS preflight
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.append("Access-Control-Allow-Origin", "*");
  res.headers.append("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.append("Access-Control-Allow-Headers", "Content-Type");
  return res;
}
