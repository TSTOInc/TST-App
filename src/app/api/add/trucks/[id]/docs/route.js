import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});



export async function POST(request, { params }) {
  const { id } = params;
  const client = await pool.connect();

  try {
    const data = await request.json();
    const { document_url} = data;

    if (!document_url) {
      return NextResponse.json({ error: 'Missing required field: document_url' }, 400);
    }

    const res = await client.query(`
      UPDATE trucks
      SET docs = ARRAY_APPEND(docs, '${document_url}')
      WHERE id = $1::uuid
      RETURNING id, docs;
      `, 
      [id]);

    return NextResponse.json({ success: true, truck_id: res.rows[0] }, 201);
  } catch (error) {
    return NextResponse.json({ error: error.message }, 500);
  } finally {
    client.release();
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, 200);
}
