"use client"
import React, { useEffect, useState } from 'react'
import ProfileHeader from '../../../../../components/layout/ProfileHeader'
import { use, useMemo } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
const ContactCard = ({ carrier }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Broker Info</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
            <p>Email: {carrier.email || "N/A"}</p>
            <p>Phone: {carrier.phone || "N/A"}</p>
            <p>Website: {carrier.website || "N/A"}</p>
        </CardContent>
    </Card>
)





export default function TablePage({ params }) {
    // Unwrap the params Promise
    const { brokerId, agentId } = React.use(params);
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchdata = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/brokers_agents/${agentId}`, {
                    cache: "no-cache"
                })
                if (!res.ok) throw new Error('Failed to fetch data')

                const data = await res.json()
                setData(data || null)

                console.log(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchdata()
    }, [])

    if (loading) return (
        <div>
            <ProfileHeader name={"Loading..."} company={"Loading..."}/>
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <ContactCard carrier={data} />
                </div>
            </div>
        </div>
    )
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!data || data.length === 0) return <div>No data found for <b>{brokerId}</b>.</div>

    return (
        <div>
            <ProfileHeader data={data} id={data.id} table="brokers_agents" name={data.name} company={data.broker[0].name} link={"brokers/" + data.broker_id} website={data.website} status={data.status} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <ContactCard carrier={data} />
                </div>
            </div>
        </div>
    )
}