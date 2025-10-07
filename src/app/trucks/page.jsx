"use client"
import React, { useEffect, useState } from 'react'
import { DataTable } from "../../components/data-table"
import CompanyCard from "../../components/custom/company-card"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { IconZoomQuestion } from "@tabler/icons-react"

const Page = () => {
    const [trucks, setTrucks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchTrucks = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/trucks`)
                if (!res.ok) throw new Error('Failed to fetch loads')
                const data = await res.json()
                setTrucks(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchTrucks()
    }, [])



    return (
        <div className="p-4">
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <CompanyCard key={i} skeleton />
                    ))}
                </div>
            ) : error ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <IconZoomQuestion />
                        </EmptyMedia>
                        <EmptyTitle>Error Loading Trucks</EmptyTitle>
                        <EmptyDescription>{error}</EmptyDescription>
                        <EmptyDescription>
                            Need help? <a href="#">Contact support</a>
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : trucks.length === 0 ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <IconZoomQuestion />
                        </EmptyMedia>
                        <EmptyTitle>No Trucks Found</EmptyTitle>
                        <EmptyDescription>
                            Create a new truck to get started.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Link href="/trucks/add">
                            <Button variant="outline" size="sm">
                                Add Truck
                            </Button>
                        </Link>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 ">
                    {trucks.map(driver => (
                        <CompanyCard key={driver.id} company={driver} truck />
                    ))}
                </div>
            )}
        </div>

    )
}

export default Page
