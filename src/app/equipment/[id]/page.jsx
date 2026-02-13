"use client"
import React from 'react'
import ProfileHeader from '@/components/layout/ProfileHeader'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import InfoCard from '@/components/data/info-card';
import { DocumentCard } from '@/components/documents/document-card';
import { DialogDemo } from '@/components/data/upload/upload-doc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTextIcon, LayoutListIcon } from 'lucide-react';



const EQUIPMENT_TYPE_LABELS = {
    reefer: "Reefer",
    dry_van: "Dry Van",
    flatbed: "Flatbed",
    step_deck: "Step Deck",
    double_drop: "Double Drop",
    lowboy: "Lowboy",
    conestoga: "Conestoga",
    tank: "Tank",
    container_chassis: "Container Chassis",
    power_only: "Power Only",
    extendable_flatbed: "Extendable Flatbed",
    gooseneck: "Gooseneck",
    side_kit_flatbed: "Side Kit Flatbed",
    dump_trailer: "Dump Trailer",
    auto_carrier: "Auto Carrier",
    hot_shot: "Hot Shot",
    livestock_trailer: "Livestock Trailer",
    vacuum_trailer: "Vacuum Trailer",
    car_flatbed: "Car Flatbed",
    platform: "Platform",
    box_trailer: "Box Trailer",
    curtain_side: "Curtain Side",
    coil_carrier: "Coil Carrier",
};
const formatEquipmentType = function (equipmentType) {
    if (!equipmentType) return "Unknown";
    return EQUIPMENT_TYPE_LABELS[equipmentType] ?? equipmentType.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

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
    
    const data = useQuery(api.getDoc.byId, { table: "equipment", id: id});
    const documents = useQuery(api.files.byId, { entityType: "equipment", entityId: id }) || [];
    const registration = documents.find((doc) => doc.category === "REGISTRATION");
    const documentsToShow = documents?.filter((file) => file.category === "MISC") || [];

    if (!data || data.length === 0) return <ProfileHeader skeleton={true} />

    return (
        <div>
            <ProfileHeader data={data} table={"equipment"} image_url={data.image_url} name={data.equipment_number} description={data.equipment_length + "ft " + formatEquipmentType(data.equipment_type)} role={data.equipment_type} status={data.status} color={data.color} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <InfoCard title="Trailer Info" fields={
                            [
                                { label: "Equipment Number", value: data.equipment_number },
                                { label: "Equipment Length", value: data.equipment_length + "ft" + " " + formatEquipmentType(data.equipment_type) },
                            ]
                        } />
                        <Card className="gap-4">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Trailer Registration</CardTitle>
                                <DialogDemo title="Add Registration" multiple={false} category="REGISTRATION" entityType="trucks" entityId={data._id} expires={true} />
                            </CardHeader>

                            <CardContent className="">
                                {!registration ? (
                                    <p className="pt-2 pl-2 text-neutral-500 italic">
                                        No Registration found for {data.equipment_number}
                                    </p>
                                ) : (
                                    <DocumentCard file={registration} />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <Tabs defaultValue="loads">
                        <TabsList className="h-10">
                            <TabsTrigger className="w-80" value="loads"><LayoutListIcon className="mr-2" /> Loads</TabsTrigger>
                            <TabsTrigger className="w-80" value="documents"><FileTextIcon className="mr-2" /> Documents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="loads" className="mt-2">
                            <ContactCard carrier={data} />
                        </TabsContent>
                        <TabsContent value="documents" className="mt-2">
                            <Card>
                                <CardHeader className="flex flex-row justify-between">
                                    <CardTitle>Truck Documents</CardTitle>
                                    <DialogDemo title="Add Document" multiple={true} category="MISC" entityType="equipment" entityId={data._id} expires={false} />
                                </CardHeader>

                                <CardContent className="w-full grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 px-4">
                                    {documentsToShow.length === 0 ? (
                                        <p className="pt-2 pl-2 text-neutral-500 italic">
                                            No documents found for {data.equipment_number}
                                        </p>
                                    ) : (
                                        documentsToShow.map((doc, idx) => (
                                            <DocumentCard key={doc.id || idx} file={doc} />
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}