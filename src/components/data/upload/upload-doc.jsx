"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import FileUpload from "@/components/file-upload";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner"

export function DialogDemo({ title, maxFiles, maxSizeMB, entityType, entityId, category, expires = false, multiple = false, perFile = false, categories = [] }) {
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);


    async function handleUpload() {
        if (!files.length) return;
        setLoading(true);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file.file);
                formData.append("entityType", entityType);
                formData.append("entityId", entityId);

                if (perFile && file.category) {
                    formData.append("category", file.category.value);
                } else {
                    formData.append("category", category);
                }

                if (expires && expiresAt) {
                    formData.append("expiresAt", expiresAt.toISOString());
                }

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    toast.error(`Upload failed for ${file.name}`, { description: "Please try again" });
                    throw new Error(`Upload failed for ${file.name}`);
                }
            }

            toast.success("Upload successful");
            setFiles([]);
            setExpiresAt(null);
            setOpen(false); // ✅ close dialog only on success
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)}>
                    <IconPlus />
                    {title}
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Upload a document. Click upload when finished.
                    </DialogDescription>
                </DialogHeader>

                <FileUpload
                    maxFiles={maxFiles}
                    maxSizeMB={maxSizeMB}
                    multiple={multiple}
                    expires={expires}
                    perFile={perFile}
                    categories={categories}
                    onFilesChange={setFiles}
                    onExpireChange={setExpiresAt}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>

                    <Button
                        onClick={handleUpload}
                        disabled={!files.length || (expires && !expiresAt) || loading}
                    >
                        {loading ? "Uploading..." : "Upload"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
