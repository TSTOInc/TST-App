"use client"
import { useMemo } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPhoneNumber } from "@/utils/formatPhone"

const CompanyCard = ({ company, carrier, broker, agent, driver, truck, equipment }) => {

    const imageUrl = useMemo(() => {
        // 1️⃣ Use image_url if available
        if (company.image_url) {
            return company.image_url;
        }

        // 2️⃣ Use website-based logo if available
        if (company.website) {
            const url = `https://img.logo.dev/${company.website}?token=pk_eshRuE0_Q422ZDQhht9A-g&retina=true`;
            return url;
        }

        // 3️⃣ Fallback: use name, truck number, or equipment number
        const fallbackText = encodeURIComponent(
            company.name || company.truck_number || company.equipment_number || "No Name"
        );

        return `https://placehold.co/600x400/C9E4FF/1B6DC1?font=montserrat&text=${fallbackText}`;
    }, [company.image_url, company.website, company.name, company.truck_number, company.equipment_number]);

    return (
        <Card>
            <CardContent>
                <img
                    src={imageUrl}
                    alt="company Image"
                    className="h-46 w-full object-cover mb-4 rounded-md"
                />
            </CardContent>

            <CardHeader >
                <CardTitle className="flex items-center justify-between">
                    {company.name}
                    {company.equipment_number && <><span>{company.equipment_number}<span className="text-neutral-400 font-normal"> {company.equipment_type}</span> </span></>}
                    <span>{company.truck_number}<span className="text-neutral-400 font-normal"> {company.truck_alias}</span> </span>
                    {!agent && <Badge onlyIcon status={company.status} />}

                </CardTitle>
                <CardDescription>
                    <span>{company.make} {company.model}</span>
                    {agent && <> <Link key={company.broker_id} href={`/brokers/${company.broker_id}`}>{company.broker.name}</Link></>}
                    {driver && (<>{company.license_number ? `License-${company.license_number} • ` : ''} {company.phone && formatPhoneNumber(company.phone)}</>)}
                    {!agent && !driver && !truck && !equipment && <> DOT-{company.usdot_number} • {company.docket_number}</>}
                </CardDescription>
            </CardHeader>

            <CardFooter>
                {carrier ? (
                    <Button asChild variant="outline" className="w-full">
                        <Link key={company.usdot_number} href={`/carriers/${company.usdot_number}`}>View Carrier</Link>
                    </Button>
                ) : broker ? (
                    <Button asChild variant="outline" className="w-full">
                        <Link key={company.broker_id} href={`/brokers/${company.id}`}>View Broker</Link>
                    </Button>
                ) : agent ? (
                    <Button asChild variant="outline" className="w-full">
                        <Link key={company.broker_id} href={`/brokers/${company.broker_id}/agents/${company.id}`}>View Broker Agent</Link>
                    </Button>
                ) : driver ? (
                    <Button asChild variant="outline" className="w-full">
                        <Link key={company.id} href={`/drivers/${company.id}`}>View Driver</Link>
                    </Button>
                ) : truck ? (
                    <Button asChild variant="outline" className="w-full">
                        <Link key={company.id} href={`/trucks/${company.id}`}>View Truck</Link>
                    </Button>
                ) : equipment ? (
                    <Button asChild variant="outline" className="w-full">
                        <Link key={company.id} href={`/equipment/${company.id}`}>View Equipment</Link>
                    </Button>
                )
                    : (
                        <Button disabled variant="outline" className="w-full">
                            Unknown
                        </Button>
                    )}
            </CardFooter>
        </Card>
    )
}


export default CompanyCard
