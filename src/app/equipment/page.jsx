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
                const res = await fetch('${process.env.NEXT_PUBLIC_API_BASE}/get/equipment')
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
        <p className="text-xl mb-8">Fetching data for <b>Equipment</b>...</p>
    </main>
    if (error) return <div>Error: {error}</div>
    if (brokers.length === 0) return <div>No equipment available right now.</div>


    return (
        <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 ">
                {brokers.map(driver => (
                    <CompanyCard key={driver.id} company={driver} equipment />
                ))}
            </div>
        </div>

    )
}

export default Page
