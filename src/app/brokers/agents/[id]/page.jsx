"use client"
import React from 'react'
import ProfileHeader from '../../../../components/layout/ProfileHeader'
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import InfoCard from '@/components/data/info-card'




export default function TablePage({ params }) {
    const { id } = React.use(params);

    const organization = useQuery(api.organizations.getCurrentOrganization)
    const orgId = organization?._id ? organization._id : "";
    const data = useQuery(api.getDoc.byId, { table: "brokers_agents", id: id, orgId: orgId });

    if (!data || data.length === 0) return <ProfileHeader skeleton={true} />

    return (
        <div>
            <ProfileHeader data={data} table="brokers_agents" name={data.name} description={data.broker_id} link={"/brokers/" + data.broker_id} status={data.status} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <InfoCard title="Agent Info" fields={[
                        { label: "Email", value: data.email },
                        { label: "Phone", value: data.phone, type: "phone" },
                    ]} />
                </div>
                
            </div>
        </div>
    )
}