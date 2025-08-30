"use client"
import React, { useEffect, useState } from 'react'
import ProfileHeader from '../../../components/layout/ProfileHeader'
import { use, useMemo } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { IconLoader2, IconPlus, IconTrash } from '@tabler/icons-react'
import { toast } from "sonner"; // or "@/components/ui/sonner" if aliased
import PDFPreview from '../../../components/custom/PDFPreview'
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
const ContactCard = ({ driver = {} }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Driver Info</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
            <p>License: {driver.license_number || "N/A"}</p>
            <p>Phone: {driver.phone || "N/A"}</p>
            <p>Email: {driver.email || "N/A"}</p>
        </CardContent>
    </Card>
)
const LicenseCard = ({ driver }) => {
    const license = driver?.license_url
    const [selectedDoc, setSelectedDoc] = useState(null);

        const handleDelete = async (documentUrl, driverId) => {
            try {
                await toast.promise(
                    fetch(`https://tst.api.incashy.com/delete/drivers/${driverId}/docs`, {
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
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchdata = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`https://tst.api.incashy.com/get/drivers/${id}`, {
                    cache: "no-cache"
                })
                if (!res.ok) throw new Error('Failed to fetch data')

                const data = await res.json()
                setData(data || null)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchdata()
    }, [])

    if (loading) return (
        <div>
            <ProfileHeader name={"Loading..."} company={"Loading..."} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <ContactCard carrier={data} />
                </div>
            </div>


        </div>
    )
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!data || data.length === 0) return <div>No data found for <b>{brokerId}</b>.</div>

    return (
        <div>
            <ProfileHeader data={data} id={data.id} table="drivers" image_url={data.image_url} name={data.name} role={"Driver | Three Stars Transport Inc"} status={data.status} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ContactCard driver={data} />
                    <LicenseCard driver={data} />
                </div>
            </div>


        </div>
    )
}