"use client"
import { notFound } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const ALLOWED_TABLES = [
    'broker_payment_terms',
    'brokers',
    'brokers_agents',
    'drivers',
    'equipment',
    'load_drivers',
    'load_tags',
    'data',
    'payment_terms',
    'stops',
    'truck_inspections',
    'truck_plates',
    'truck_repairs',
    'trucks',
]

export default function TablePage({ params }) {
    const { table } = React.use(params);

    // If table not in whitelist → trigger Next.js 404
    if (!ALLOWED_TABLES.includes(table)) {
        notFound()
    }


    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchdata = async () => {
            setLoading(true)
            setError(null)
            try {


                const res = await fetch(`https://tst.api.incashy.com/get/${table}`, {
                    cache: "no-cache"
                })
                if (!res.ok) throw new Error('Failed to fetch data')

                const data = await res.json()
                setData(Array.isArray(data) ? data : [])

            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchdata()
    }, [table])

    if (loading) return <div>Loading data from <b>{table}</b>...</div>
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!data || data.length === 0) return <div>No data found for <b>{table}</b>.</div>



    // If it's valid → render your template
    return (
        <div>
            <DataTable data={data} />
        </div>
    )
}
