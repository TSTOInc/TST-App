"use client"
import { useState } from "react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"; // or "@/components/ui/sonner" if aliased
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
import { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api";
import { EllipsisVerticalIcon, EyeIcon, FileTextIcon, PencilIcon, TrashIcon, FileIcon, FileImageIcon, FileVideoIcon, DownloadIcon, OctagonAlertIcon, Dot, ClockIcon } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@supabase/supabase-js'
import { cn } from "@/lib/utils"
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react"
import { Field, FieldLabel } from "@/components/ui/field"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return FileImageIcon;
    if (mimeType === 'application/pdf') return FileTextIcon;
    if (mimeType.startsWith('video/')) return FileVideoIcon;
    if (mimeType.startsWith('text/')) return FileTextIcon;
    return FileIcon; // fallback generic file icon
}

function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
export const FILE_CATEGORY_LABELS = {
    CDL: "CDL",
    BOL: "BOL",
    POD: "POD",
    RATE_CONFIRMATION: "Rate Confirmation",
    INNOUT_TICKET: "In/Out Ticket",
    LUMPER: "Lumper Receipt",
    SCALE_TICKET: "Scale Ticket",
    TRAILER_INTERCHANGE: "Trailer Interchange",
    CARRIER_AGREEMENT: "Carrier Agreement",
    QUICKPAY_AGREEMENT: "QuickPay Agreement",
    REGISTRATION: "Registration",
    ID_CARD: "ID Card",
    MISC: "Other",
};
export function getCategoryLabel(category) {
    if (!category) return "";
    return (
        FILE_CATEGORY_LABELS[category] ??
        category
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
    );
}

const getLicenseStatus = (expiresAt) => {
    if (!expiresAt) return { status: "Unknown" };

    const expires = new Date(expiresAt).getTime();
    const now = Date.now();

    if (isNaN(expires)) return { status: "Unknown" };

    const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now - expires) / (1000 * 60 * 60 * 24) - 1);

    if (daysLeft < 0) return { status: "Expired", daysPassed };
    if (daysLeft == 0) return { status: "Expires Today", daysLeft };
    if (daysLeft <= 90) return { status: "Expiring", daysLeft };

    return { status: "Active", daysLeft };
};

const statusColor = {
    Active: "text-green-500",
    Expiring: "text-amber-500",
    "Expires Today": "text-red-600",
    Expired: "text-red-600",
    Unknown: "text-muted-foreground",
};
export function DocumentCard({ file }) {

    const Icon = getFileIcon(file.mimeType);

    const [deleteFile, setDeleteFile] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [renameFileOriginal, setRenameFileOriginal] = useState(null);
    const [renameFile, setRenameFile] = useState(null);
    const [changeExpirationOriginal, setChangeExpirationOriginal] = useState(null);
    const [changeExpiration, setChangeExpiration] = useState(null);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const deleteFileMutation = useMutation(api.files.deleteFile);
    const renameFileMutation = useMutation(api.files.renameFile);
    const changeExpirationMutation = useMutation(api.files.changeExpiration);




    const description = formatBytes(file.size);
    const licenseStatus = file
        ? getLicenseStatus(file.expiresAt)
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


    const handleDelete = async (documentId) => {
        try {
            await deleteFileMutation({ id: documentId });
            toast.success("Document deleted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete document");
        }
    };
    // Inside your component

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

    const handleChangeExpiration = async () => {
        if (!changeExpiration) return;

        // Check if name actually changed and is at least 2 characters
        if (changeExpiration === changeExpirationOriginal) {
            toast.error("No changes detected");
            return;
        }

        try {
            await changeExpirationMutation({ id: changeExpiration.id, expiresAt: changeExpiration.expiresAt.getTime() });
            toast.success("Document Expiration date changed successfully!");
            setChangeExpiration(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to change document expiration");
        }
    };

    return (
        <>
            <div
                className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3"


            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="group relative flex aspect-square h-20 w-20 items-center justify-center rounded-md border cursor-pointer" onClick={() => handleOpenDoc(file.storageKey)}>
                        {/* File icon (default) */}
                        <Icon
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
                            <p className="font-bold">{file.category != "MISC" ? getCategoryLabel(file.category) : file.filename}</p>
                            {file.expiresAt && (
                                <p
                                    className={cn(
                                        "flex items-center gap-2",
                                        statusColor[licenseStatus.status]
                                    )}
                                >

                                    {licenseStatus.status}
                                    {licenseStatus.status === "Expired" && ` ${Math.abs(licenseStatus.daysPassed)} day${licenseStatus.daysPassed !== 1 ? "s" : ""} ago`}
                                    {licenseStatus.status === "Expiring" && ` in ${licenseStatus.daysLeft} day` + (licenseStatus.daysLeft > 1 ? "s" : "")}

                                    {licenseStatus.status === "Expiring" && <IconAlertTriangle className="size-4 mt-0.5" strokeWidth={2} />}
                                    {licenseStatus.status === "Expires Today" && <OctagonAlertIcon className="size-4 mt-0.5" strokeWidth={3} />}
                                    {licenseStatus.status === "Expired" && <OctagonAlertIcon className="size-4 mt-0.5" strokeWidth={3} />}
                                    {licenseStatus.status === "Active" && <IconCheck className="size-4 mt-0.5" strokeWidth={3} />}
                                    {licenseStatus.status === "Unknown" && <IconAlertTriangle className="size-4 mt-0.5" strokeWidth={3} />}
                                </p>
                            )}
                        </span>

                        <span className="flex flex-nowrap items-center gap-1 min-w-0">
                            <p className="shrink-0 text-muted-foreground">
                                {formatBytes(file.size)}
                            </p>
                            {file.category != "MISC" && <p className="text-muted-foreground"><Dot className="text-muted-foreground" /></p>}
                            <p className="truncate text-muted-foreground">
                                {file.category != "MISC" ? file.filename : ''}
                            </p>
                        </span>



                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className='rounded-full mr-2'><EllipsisVerticalIcon /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent >

                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenDoc(file.storageKey)}>
                            <EyeIcon /> View
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownload(file.storageKey, file.filename)}>
                            <DownloadIcon /> Download
                        </DropdownMenuItem>

                        {file.expiresAt && (
                            <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                const date = file.expiresAt ? new Date(file.expiresAt) : null;
                                setChangeExpiration({ id: file._id, expiresAt: date });
                                setChangeExpirationOriginal(date);
                            }}>
                                <ClockIcon /> Expiration
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem className="cursor-pointer" onClick={() => {
                            setRenameFile({ id: file._id, name: file.filename });
                            setRenameFileOriginal(file.filename);
                        }}>
                            <PencilIcon /> Rename
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer" variant="destructive" onClick={(e) => {
                            e.stopPropagation(); // Prevent opening PDF
                            setDeleteFile(file);
                        }}>
                            <TrashIcon />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={!!deleteFile} onOpenChange={(open) => !open && setDeleteFile(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-bold">{deleteFile?.filename || "this document"}</span>
                        ?
                    </AlertDialogDescription>

                    <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                            <Button variant="secondary">Cancel</Button>
                        </AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={() => handleDelete(deleteFile._id)}
                        >
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!changeExpiration} onOpenChange={(open) => !open && setChangeExpiration(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Expiration</DialogTitle>
                        <DialogDescription>
                            Set the expiration date for this document.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Field>
                            <FieldLabel htmlFor="input-field-username">Expires on</FieldLabel>
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date"
                                        className="justify-start font-normal"
                                    >
                                        {changeExpiration?.expiresAt ? changeExpiration.expiresAt.toLocaleDateString() : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={changeExpiration?.expiresAt ?? undefined}
                                        defaultMonth={changeExpiration?.expiresAt ?? undefined}
                                        captionLayout="dropdown"
                                        fromYear={new Date().getFullYear()}
                                        toYear={new Date().getFullYear() + 15}
                                        onSelect={(date) => {
                                            setChangeExpiration({ ...changeExpiration, expiresAt: date });
                                            setPopoverOpen(false)
                                        }}
                                    />

                                </PopoverContent>
                            </Popover>
                        </Field>
                    </div>
                    <DialogFooter className="sm:justify-start gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleChangeExpiration}
                            disabled={
                                !changeExpiration?.expiresAt || // no file selected
                                changeExpiration.expiresAt.getTime() === changeExpirationOriginal.getTime()
                            }
                        >
                            Save
                        </Button>

                    </DialogFooter>
                </DialogContent>
            </Dialog>


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
                        <DialogTitle></DialogTitle>
                    </DialogHeader>
                    {selectedDoc && (() => {
                        if (file.mimeType === "application/pdf") {
                            return <embed src={selectedDoc} type="application/pdf" width="100%" height="100%" />;
                        } else if (file.mimeType.startsWith("image/")) {
                            return <img src={selectedDoc} alt={file.filename} className="w-full h-full object-contain" />;
                        }
                        else if (file.mimeType.startsWith("video/")) {
                            return <video src={selectedDoc} controls className="w-full h-full object-contain" />;
                        }
                        else {
                            return <p className="text-center text-muted-foreground">
                                Preview not available for this file type.
                            </p>;
                        }
                    })()}
                </DialogContent>
            </Dialog>

        </>
    )
}