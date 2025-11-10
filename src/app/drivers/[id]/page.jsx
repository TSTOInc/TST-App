"use client"
import React, { useState } from 'react'
import ProfileHeader from '../../../components/layout/ProfileHeader'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { toast } from "sonner"; // or "@/components/ui/sonner" if aliased
import PDFPreview from '../../../components/custom/PDFPreview'
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import InfoCard from '@/components/data/info-card'
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api";
import { useOrganization } from '@clerk/nextjs';

const LicenseCard = ({ driver }) => {
    const license = driver?.license_url
    const [selectedDoc, setSelectedDoc] = useState(null);

    const handleDelete = async (documentUrl, driverId) => {
        try {
            await toast.promise(
                fetch(`/api/delete/drivers/${driverId}/docs`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ document_url: documentUrl }),
                }).then(async (res) => {
                    if (!res.ok) throw new Error("Failed to delete document");

                    // Update local state
                    setTruckData((prev) => ({
                        ...prev,
                        docs: prev.docs.filter((doc) => doc !== documentUrl),
                    }));
                }),
                {
                    loading: "Deleting document...",
                    success: "Document deleted successfully!",
                    error: (err) => err.message || "Failed to delete document",
                }
            );
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Driver License</CardTitle>
                {!license && (
                    <Button>
                        <IconPlus /> Add Driver License
                    </Button>
                )}

            </CardHeader>
            <CardContent className="space-y-2">
                {!license ? (
                    <p className="text-neutral-500 italic">
                        No license found for {driver.name}
                    </p>
                ) : (
                    <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-3 md:grid-cols-1 px-4">
                        <Card
                            key={license || idx}
                            className="cursor-pointer"
                            onClick={() => setSelectedDoc(license)}
                        >
                            <CardContent className="space-y-2 flex justify-center">
                                <PDFPreview
                                    fileUrl={license}
                                    style={{
                                        border: "none",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                        display: "block",
                                    }}
                                />
                            </CardContent>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>
                                    {license ? decodeURIComponent(license.split("/").pop()) : "Unnamed Document"}
                                </CardTitle>
                                <Button
                                    variant="destructive"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening PDF
                                        handleDelete(license, driver.id); // Pass the document URL and truck ID
                                    }}
                                >
                                    <IconTrash />
                                </Button>
                            </CardHeader>
                        </Card>
                    </div>

                )}
            </CardContent>
            <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
                <DialogContent fullscreen>
                    <DialogHeader>
                        <DialogTitle><span>{""}</span></DialogTitle>
                    </DialogHeader>
                    {selectedDoc && <embed src={selectedDoc} type="application/pdf" width="100%" height="100%" />}
                </DialogContent>
            </Dialog>
        </Card>
    );
};



export default function TablePage({ params }) {
    // Unwrap the params Promise
    const { id } = React.use(params);

    const { organization } = useOrganization();
    const orgId = organization ? organization.id : "";
    const data = useQuery(api.getDoc.byId, { table: "drivers", id: id , orgId: orgId });

    if (!data || data.length === 0) return <ProfileHeader skeleton={true} />

    return (
        <div>
            <ProfileHeader data={data} table="drivers" image_url={data.image_url} name={data.name} description={"Driver | Three Stars Transport Inc"} status={data.status} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard
                        title="Driver Info"
                        fields={[
                            { label: "Driver License", value: data.license_number },
                            { label: "Phone", value: data.phone, type: "phone" },
                            { label: "Email", value: data.email },
                        ]}
                    />
                    <LicenseCard driver={data} />
                </div>
            </div>
        </div>
    )
}