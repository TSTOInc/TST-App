"use client"
import { notFound } from 'next/navigation'
import React, { useEffect, useState } from 'react'

export default function TablePage({ params }) {
    const { id } = React.use(params);

    // If id not provided → trigger Next.js 404
    //if (!id) {
    //notFound()
    //}


    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchdata = async () => {
            setLoading(true)
            setError(null)
            try {


                const res = await fetch(`https://tst.api.incashy.com/fmcsa/get?type=usdot&q=${id}`, {
                    cache: "no-cache"
                })
                if (!res.ok) throw new Error('Failed to fetch data')
                const data = await res.json()
                setData(data);

            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchdata()
    }, [id])

    if (loading) return <div>Loading data from <b>{id}</b>...</div>
    if (error) return <div className="text-red-500">Error: {error}</div>



    // If it's valid → render your template
    return (
        <div>
            <h1>Your data:</h1>
            <h2>Name: {data.legalName}</h2>
            <h2>DOT Number: {data.dotNumber}</h2>
            <h2>MC/MX Number: {data.mcNumber}</h2>
        </div>
    )
}
