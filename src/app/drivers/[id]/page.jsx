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
    DialogFooter,
    DialogDescription,
    DialogClose

} from "@/components/ui/dialog";
import InfoCard from '@/components/data/info-card'
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api";
import { useOrganization } from '@clerk/nextjs';
import { DialogDemo } from "@/components/data/upload/upload-doc";
import { EllipsisVerticalIcon, EyeIcon, FileTextIcon, OctagonAlertIcon, PencilIcon, RefreshCwIcon, TrashIcon, FileIcon, FileImageIcon, FileVideoIcon, DownloadIcon } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group"
import { DocumentCard } from '@/components/documents/document-card'


const statusColor = {
    Active: "text-green-500",
    Expiring: "text-amber-500",
    Expired: "text-red-600",
    Unknown: "text-muted-foreground",
};
function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return FileImageIcon;
    if (mimeType === 'application/pdf') return FileTextIcon;
    if (mimeType.startsWith('video/')) return FileVideoIcon;
    if (mimeType.startsWith('text/')) return FileTextIcon;
    return FileIcon; // fallback generic file icon
}
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

const LicenseCard = ({ driver, files, orgId }) => {
    const license = files?.find((file) => file.category === "CDL");
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [renameFileOriginal, setRenameFileOriginal] = useState(null);
    const [renameFile, setRenameFile] = useState(null);
    const renameFileMutation = useMutation(api.files.renameFile);
    const deleteFileMutation = useMutation(api.files.deleteFile);
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
    const handleDownload = async (filePath, filename) => {
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            // Generate signed URL
            const { data, error } = await supabase.storage
                .from('TST')
                .createSignedUrl(filePath, 60); // 60 seconds should be enough for download

            if (error) throw error;

            // Download file with signed URL
            const res = await fetch(data.signedUrl);
            if (!res.ok) {
                throw new Error("Failed to download file");
            }
            const blob = await res.blob();

            // Create a temporary link to trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename || "download";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
            toast.error("Failed to download file");
        }
    };
    const handleRename = async () => {
        if (!renameFile) return;

        // Remove file extension for comparison
        const newName = renameFile.name.replace(/\.pdf$/i, "");
        const originalName = renameFileOriginal.replace(/\.pdf$/i, "");

        // Check if name actually changed and is at least 2 characters
        if (newName.length < 2) {
            toast.error("File name must be at least 2 characters");
            return;
        }
        if (newName === originalName) {
            toast.error("No changes detected");
            return;
        }

        try {
            await renameFileMutation({ id: renameFile.id, filename: renameFile.name });
            toast.success("Document renamed successfully!");
            setRenameFile(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to rename document");
        }
    };
    const handleDelete = async (documentId) => {
        try {
            await deleteFileMutation({ id: documentId, orgId: orgId });
            toast.success("License deleted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete license");
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
                    <div className="w-full grid gap-4 grid-cols-1 px-4">

                        <DocumentCard file={license} />
                    </div>

                )}
            </CardContent>
            {/* Rename Dialog */}
            <Dialog open={!!renameFile} onOpenChange={(open) => !open && setRenameFile(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Document</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="rename">{renameFileOriginal}</Label>
                        <InputGroup className="max-w-xs">
                            <InputGroupInput
                                id="rename"
                                value={renameFile?.name.replace(/\.pdf$/i, "") || ""}
                                onChange={(e) =>
                                    setRenameFile((prev) =>
                                        prev
                                            ? { ...prev, name: e.target.value + ".pdf" }
                                            : prev
                                    )
                                }
                            />
                            <InputGroupAddon align="inline-end">{renameFile?.name.match(/\.[^.]+$/)?.[0] || ""}</InputGroupAddon>
                        </InputGroup>
                    </div>
                    <DialogFooter className="sm:justify-start gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleRename}
                            disabled={
                                !renameFile || // no file selected
                                renameFile.name.replace(/\.pdf$/i, "") === renameFileOriginal.replace(/\.pdf$/i, "") || // no actual name change
                                renameFile.name.replace(/\.pdf$/i, "").length < 2 // too short
                            }
                        >
                            Save
                        </Button>

                    </DialogFooter>
                </DialogContent>
            </Dialog>
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



const FilesCard = ({ driver, files, orgId }) => {
    const filteredFiles = files?.filter((file) => file.category !== "CDL") || [];
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Driver Documents</CardTitle>
                <DialogDemo title="Add Document" multiple={true} perFile={false} category="MISC" entityType="drivers" entityId={driver._id} expires={false} />

            </CardHeader>
            <CardContent className="space-y-2">
                {!filteredFiles.length ? (
                    <p className="text-neutral-500 italic">
                        No documents found for {driver.name}
                    </p>
                ) : (
                    <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 px-4">
                        {filteredFiles.map((file) => {
                            const Icon = getFileIcon(file.mimeType);
                            return (
                                <DocumentCard
                                    key={file._id}
                                    file={file}
                                    Icon={Icon}
                                />
                            )
                        })}
                    </div>
                )}
            </CardContent>
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
                    <LicenseCard driver={data} files={files} orgId={orgId} />
                </div>
                <FilesCard driver={data} files={files} orgId={orgId} />
            </div>
        </div>
    )
}