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
import { SearchBar } from "@/components/search-bar"


const Page = () => {
    const [equipments, setEquipments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchequipments = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/equipment`)
                if (!res.ok) throw new Error('Failed to fetch loads')
                const data = await res.json()
                setEquipments(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchequipments()
    }, [])

    const filteredData = equipments.filter((item) =>
        item.equipment_number.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <EmptyTitle>Error Loading Equipment</EmptyTitle>
                        <EmptyDescription>{error}</EmptyDescription>
                        <EmptyDescription>
                            Need help? <a href="#">Contact support</a>
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : equipments.length === 0 ? (
                <Empty className="border border-dashed">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <IconZoomQuestion />
                        </EmptyMedia>
                        <EmptyTitle>No Equipment Found</EmptyTitle>
                        <EmptyDescription>
                            Create new equipment to get started.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Link href="/equipment/add">
                            <Button variant="outline" size="sm">
                                Add Equipment
                            </Button>
                        </Link>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="space-y-4">
                    <SearchBar isLoading={true} value={searchQuery} onValueChange={setSearchQuery} placeholder="Search Equipment..." />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {filteredData.map(driver => (
                            <CompanyCard key={driver.id} company={driver} equipment />
                        ))}
                    </div>
                </div>
            )}
        </div>

    )
}

export default Page
