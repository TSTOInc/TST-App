"use client"
import React, { useEffect, useState } from 'react'
import ProfileHeader from '../../../components/layout/ProfileHeader'
import { use, useMemo } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { IconLoader2 } from '@tabler/icons-react'
import { toast } from "sonner"; // or "@/components/ui/sonner" if aliased
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
const ContactCard = ({ carrier }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Loads using <b>{carrier.equipment_number}</b></CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
            <p className="text-neutral-500 italic">no loads found for {carrier.equipment_number}</p>
        </CardContent>
    </Card>
)




export default function TablePage({ params }) {
    // Unwrap the params Promise
    const { id } = React.use(params);
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchdata = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/equipment/${id}`, {
                    cache: "no-cache"
                })
                if (!res.ok) throw new Error('Failed to fetch data')

                const data = await res.json()
                setData(data || null)
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
            <ProfileHeader name={"Loading..."} company={"Loading..."} />
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
            <ProfileHeader data={data} id={data.id} table={"equipment"} image_url={data.image_url} name={data.equipment_number} role={data.equipment_type} status={data.status} color={data.color} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <ContactCard carrier={data} />
                </div>
            </div>
        </div>
    )
}