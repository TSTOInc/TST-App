"use client"
import React, { useEffect, useState } from 'react'
import { DataTable } from "../../../components/data-table"
import CompanyCard from "../../../components/custom/company-card"
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
const Page = () => {
    const [brokers, setBrokers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchBrokers = async () => {
            try {
                const res = await fetch('${process.env.NEXT_PUBLIC_API_BASE}/get/brokers_agents')
                if (!res.ok) throw new Error('Failed to fetch loads')
                const data = await res.json()
                setBrokers(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchBrokers()
    }, [])

    if (loading) return <main className="flex flex-col justify-center items-center h-full text-center p-8 flex-grow">
        <h1 className="text-6xl lg:text-8xl font-bold mb-4">Loading...</h1>
        <p className="text-xl mb-8">Fetching data for <b>Broker Agents</b>...</p>
        </main>
    if (error) return <div>Error: {error}</div>
    if (brokers.length === 0) return <div>No brokers available right now.</div>

    // remove the last 2 columns from the data
    const filteredBrokers = brokers.map(brokers => { const { created_at, updated_at, ...rest } = brokers; return rest })

    return (
        <div className="p-4">
            <h2 className="text-2xl mb-4">All Broker Agents:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 ">
                {filteredBrokers.map(agent => (
                    <CompanyCard agent key={agent.id} company={agent} />
                ))}
            </div>
        </div>

    )
}

export default Page
