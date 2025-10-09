"use client"
import React, { useEffect, useState } from 'react'
import { DataTable } from "../../../components/data-table"
import CompanyCard from "../../../components/custom/company-card"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { IconZoomQuestion } from "@tabler/icons-react"
import { SearchBar } from "@/components/search-bar"




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
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchBrokers = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/brokers_agents`)
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
    const filteredBrokers = brokers.map(brokers => { const { created_at, updated_at, ...rest } = brokers; return rest })
    const filteredData = filteredBrokers.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4">
            {loading ? (
                <div className="space-y-4">
                    <SearchBar skeleton />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <CompanyCard key={i} skeleton />
                    ))}
                </div>
                </div>
            ) : error ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <IconZoomQuestion />
                        </EmptyMedia>
                        <EmptyTitle>Error Loading Brokers Agents</EmptyTitle>
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
                        <EmptyTitle>No Brokers Agents Found</EmptyTitle>
                        <EmptyDescription>
                            Create a new broker agent to get started.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Link href="/brokers/agents/add">
                            <Button variant="outline" size="sm">
                                Add Broker Agent
                            </Button>
                        </Link>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className='space-y-4'>
                    <SearchBar value={searchQuery} onValueChange={setSearchQuery} placeholder="Search Brokers Agents..." />

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {filteredData.map(agent => (
                            <CompanyCard agent key={agent.id} company={agent} />
                        ))}
                    </div>
                </div>
            )}

        </div>

    )
}

export default Page
