"use client"
import React, { useEffect, useState } from 'react'
import { DataTable } from "../../components/data-table"
import CompanyCard from "../../components/custom/company-card"
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
                const res = await fetch('https://tst.api.incashy.com/get/brokers')
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
        <p className="text-xl mb-8">Fetching data for <b>Brokers</b>...</p>
        </main>
    if (error) return <div>Error: {error}</div>
    if (brokers.length === 0) return <main className="flex flex-col justify-center items-center h-full text-center p-8 flex-grow">
            <h1 className="text-6xl lg:text-8xl font-bold mb-4">No Data</h1>
            <p className="text-xl mb-8">We couldn't find any data for <b>Brokers</b>.</p>
        </main>

    // remove the last 2 columns from the data
    const filteredBrokers = brokers.map(brokers => { const { created_at, updated_at, ...rest } = brokers; return rest })

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 ">
                {filteredBrokers.map(carrier => (
                    <CompanyCard broker key={carrier.usdot_number} company={carrier} />
                ))}
            </div>
        </div>

    )
}

export default Page
