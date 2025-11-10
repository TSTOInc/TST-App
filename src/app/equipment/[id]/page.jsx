"use client"
import React from 'react'
import ProfileHeader from '@/components/layout/ProfileHeader'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useOrganization } from '@clerk/nextjs';


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
    const { id } = React.use(params);

    const { organization } = useOrganization();
    const orgId = organization ? organization.id : "";
    const data = useQuery(api.getDoc.byId, { table: "equipment", id: id , orgId: orgId });

    if (!data || data.length === 0) return <ProfileHeader skeleton={true} />

    return (
        <div>
            <ProfileHeader data={data} table={"equipment"} image_url={data.image_url} name={data.equipment_number} role={data.equipment_type} status={data.status} color={data.color} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <ContactCard carrier={data} />
                </div>
            </div>
        </div>
    )
}