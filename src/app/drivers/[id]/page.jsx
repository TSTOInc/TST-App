"use client"
import React, { useState } from 'react'
import ProfileHeader from '../../../components/layout/ProfileHeader'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconAlertTriangle, IconCheck, IconPlus, IconTrash } from '@tabler/icons-react'
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
import { DialogDemo } from "@/components/data/upload/upload-doc";
import { CreditCardIcon, EllipsisVertical, EllipsisVerticalIcon, EyeIcon, FileTextIcon, LogOutIcon, OctagonAlertIcon, PencilIcon, RefreshCwIcon, SettingsIcon, SirenIcon, TrashIcon, UserIcon } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'



const statusColor = {
    Active: "text-green-500",
    Expiring: "text-amber-500",
    Expired: "text-red-600",
    Unknown: "text-muted-foreground",
};

// Helper function to determine license status
const getLicenseStatus = (expiresAt) => {
    if (!expiresAt) return { status: "Unknown" };

    const expires = new Date(expiresAt).getTime();
    const now = Date.now();

    if (isNaN(expires)) return { status: "Unknown" };

    const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { status: "Expired", daysLeft };
    if (daysLeft <= 90) return { status: "Expiring", daysLeft };

    return { status: "Active", daysLeft };
};

const LicenseCard = ({ driver, files }) => {
    const license = files?.find((file) => file.category === "CDL");
    const [selectedDoc, setSelectedDoc] = useState(null);

    const licenseStatus = license
        ? getLicenseStatus(license.expiresAt)
        : { status: "Unknown" };


    const handleOpenDoc = async (filePath) => {
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            )

            const { data, error } = await supabase.storage
                .from('TST')
                .createSignedUrl(filePath, 5)

            if (error) throw error

            setSelectedDoc(data.signedUrl)
        } catch (err) {
            console.error(err)
        }
    }

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
                    <DialogDemo title="Add Driver License" multiple={false} category="CDL" entityType="drivers" entityId={driver._id} expires={true} />
                )}

            </CardHeader>
            <CardContent className="space-y-2">
                {!license ? (
                    <p className="text-neutral-500 italic">
                        No license found for {driver.name}
                    </p>
                ) : (
                    <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-3 md:grid-cols-1 px-4">

                        <div
                            className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3"
                            key={license || idx}

                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="group relative flex aspect-square h-20 w-20 items-center justify-center rounded-md border cursor-pointer" onClick={() => handleOpenDoc(license.storageKey)}>
                                    {/* File icon (default) */}
                                    <FileTextIcon
                                        strokeWidth={1.25}
                                        className="absolute size-8 opacity-60 transition-opacity duration-200 group-hover:opacity-0"
                                    />

                                    {/* Eye icon (on hover) */}
                                    <EyeIcon
                                        strokeWidth={1.5}
                                        className="absolute size-8 opacity-0 transition-opacity duration-200 group-hover:opacity-60"
                                    />
                                </div>

                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className="flex items-center gap-2">
                                        <p className="font-bold">CDL</p>
                                        <p
                                            className={cn(
                                                "flex items-center gap-1",
                                                statusColor[licenseStatus.status]
                                            )}
                                        >
                                            {licenseStatus.status}
                                            {licenseStatus.status === "Expired" && ` ${Math.abs(licenseStatus.daysLeft)} day${licenseStatus.daysLeft !== 1 ? "s" : ""} ago`}
                                            {licenseStatus.status === "Expiring" && ` in ${licenseStatus.daysLeft} day` + (licenseStatus.daysLeft > 1 ? "s" : "")}
                                            {licenseStatus.status === "Expiring" && <IconAlertTriangle className="size-4 mt-0.5" strokeWidth={2} />}
                                            {licenseStatus.status === "Expired" && <OctagonAlertIcon className="size-4 mt-0.5" strokeWidth={3} />}
                                            {licenseStatus.status === "Active" && <IconCheck className="size-4 mt-0.5" strokeWidth={3} />}
                                            {licenseStatus.status === "Unknown" && <IconAlertTriangle className="size-4 mt-0.5" strokeWidth={3} />}
                                        </p>
                                    </span>
                                    <p className="truncate text-muted-foreground">
                                        {license.filename}
                                    </p>



                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className='rounded-full mr-2'><EllipsisVerticalIcon /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent >
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenDoc(license.storageKey)}>
                                        <EyeIcon />
                                        View License
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <PencilIcon />
                                        Rename File
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <RefreshCwIcon />
                                        Update License
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer" variant="destructive" onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening PDF
                                        handleDelete(license, driver.id); // Pass the document URL and truck ID
                                    }}>
                                        <TrashIcon />
                                        Delete License
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
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
    const data = useQuery(api.getDoc.byId, { table: "drivers", id: id, orgId: orgId });
    const files = useQuery(api.files.byId, { entityType: "drivers", entityId: id, orgId: orgId }) || [];

    if (!data || data.length === 0) return <ProfileHeader skeleton={true} />

    return (
        <div>
            <ProfileHeader data={data} table="drivers" image_url={data.image_url} name={data.name} description={"Driver | " + organization.name} status={data.status} />
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
                    <LicenseCard driver={data} files={files} />
                </div>
            </div>
        </div>
    )
}