"use client"
import { notFound } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { DataTable } from "../../components/data-table"

export default function TablePage() {

    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchdata = async () => {
            setLoading(true)
            setError(null)
            try {


                const res = await fetch(`https://tst.api.incashy.com/get/loads`, {
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
    }, [])

    if (loading) return (
        <main className="flex flex-col justify-center items-center h-full text-center p-8 flex-grow">
            <h1 className="text-8xl font-bold mb-4">Loading...</h1>
            <p className="text-xl mb-8">Fetching data for <b>Loads</b>...</p>

        </main>
    )
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!data || data.length === 0) return (
        <main className="flex flex-col justify-center items-center h-full text-center p-8 flex-grow">
            <h1 className="text-8xl font-bold mb-4">No Data</h1>
            <p className="text-xl mb-8">We couldn't find any data for <b>Loads</b>.</p>
        </main>
    )

    // remove the last 2 columns from the data
    const filteredData = data.map(data => { const { created_at, updated_at, ...rest } = data; return rest })

    // If it's valid → render your template
    return (
        <div>
            <DataTable data={filteredData} />
        </div>
    )
}
