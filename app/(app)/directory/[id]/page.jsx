"use client"
import { notFound } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Loading from '@/components/custom/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { IconMapPin } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Car } from 'lucide-react';


export default function TablePage({ params }) {
    const { id } = React.use(params);

    if (!id) notFound();

    const [carrier, setCarrier] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`/api/fmcsa/get?type=usdot&q=${id}`, {
                    cache: "no-cache"
                })
                if (!res.ok) throw new Error('Failed to fetch data')
                const json = await res.json()
                setCarrier(json.carriers[0])
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    if (loading) return <Loading />
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!carrier) return <div>No carrier data found</div>
    let EntityType
    if (carrier.brokerAuthorityStatus == "A") {
        //save type as broker
        EntityType = "Broker"
    }
    else {
        //save type as carrier
        EntityType = "Carrier"
    }

    return (
<div className="p-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{carrier.legalName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 space-x-4">
                <h2>Address: {carrier.phyStreet}, {carrier.phyCity}, {carrier.phyState}{" "} {carrier.phyZipcode}</h2>
                <span>DOT Number: {carrier.dotNumber}</span><span>|</span><span>MC/MX Number: {carrier.docketNumber || "N/A"}</span>
            </CardContent>
            <CardFooter className="flex flex-row items-center space-x-4">
                <Button asChild variant="outline">
                    <Link
                        href={`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${carrier.dotNumber || ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        See on FMCSA
                    </Link>
                </Button>
                <Button asChild>
                    <Link
                        href={`/brokers/add?name=${encodeURIComponent(carrier.legalName)}&usdot_number=${carrier.dotNumber}&address=${encodeURIComponent(carrier.phyStreet)}, ${carrier.phyCity}, ${carrier.phyState} ${carrier.phyZipcode}&docket_number=${carrier.docketNumber || ""}`}
                    >
                        Add this {EntityType}
                    </Link>
                </Button>
            </CardFooter>



        </Card>
</div>
    )
}
