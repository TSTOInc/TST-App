"use client"
import React, { useEffect, useState } from 'react'
import { DataTable } from "../../components/data-table"
import CompanyCard from "../../components/custom/company-card"
import { Button } from "@/components/ui/button"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { IconZoomQuestion } from "@tabler/icons-react"
import Link from 'next/link'


const Page = () => {
    const [brokers, setBrokers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchBrokers = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/brokers`)
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

    // remove the last 2 columns from the data
    const filteredBrokers = brokers.map(broker => { const { created_at, updated_at, ...rest } = broker; return rest })

    return (
        <div className="p-4">
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <CompanyCard key={i} skeleton/>
                    ))}
                </div>
            ) : error ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <IconZoomQuestion />
                        </EmptyMedia>
                        <EmptyTitle>Error Loading Brokers</EmptyTitle>
                        <EmptyDescription>{error}</EmptyDescription>
                        <EmptyDescription>
                            Need help? <a href="#">Contact support</a>
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : filteredBrokers.length === 0 ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <IconZoomQuestion />
                        </EmptyMedia>
                        <EmptyTitle>No Broker Found</EmptyTitle>
                        <EmptyDescription>
                            Create a new broker to get started.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Link href="/brokers/add">
                            <Button variant="outline" size="sm">
                                Add Broker
                            </Button>
                        </Link>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredBrokers.map(carrier => (
                        <CompanyCard broker key={carrier.usdot_number || carrier.id} company={carrier} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Page
