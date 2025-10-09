import { NextResponse } from 'next/server'
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const ALLOWED_TABLES = [
  'broker_payment_terms',
  'brokers',
  'brokers_agents',
  'drivers',
  'equipment',
  'load_drivers',
  'load_tags',
  'loads',
  'payment_terms',
  'stops',
  'truck_inspections',
  'truck_plates',
  'truck_repairs',
  'trucks',
]



export async function GET(req, { params }) {
  const { table, id } = await params

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table name' }, 400)
  }

  try {
    let data

    switch (table) {
      case 'brokers_agents': {
        if (id) {
          // Single agent
          const result = await pool.query(
            `SELECT * FROM brokers_agents WHERE id = $1::uuid;`,
            [id]
          )
          const brokerAgent = result.rows[0] || null

          if (brokerAgent) {
            const brokerResult = await pool.query(
              `SELECT name FROM brokers WHERE id = $1::uuid;`,
              [brokerAgent.broker_id]
            )
            brokerAgent.broker = brokerResult.rows[0] || null
          }

          data = brokerAgent ? [brokerAgent] : []
        } else {
          // All agents
          const agentsResult = await pool.query(`SELECT * FROM brokers_agents;`)
          const agents = agentsResult.rows

          // Attach broker name to each agent
          for (const agent of agents) {
            const brokerResult = await pool.query(
              `SELECT name FROM brokers WHERE id = $1::uuid;`,
              [agent.broker_id]
            )
            agent.broker = brokerResult.rows[0] || null
          }

          data = agents
        }
        break
      }



      default: {
        const queryText = id
          ? `SELECT * FROM ${table} WHERE id = $1::uuid;`
          : `SELECT * FROM ${table};`
        const values = id ? [id] : []
        const result = await pool.query(queryText, values)
        data = id ? result.rows[0] || null : result.rows
        break
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, 500)
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, 204)
}
