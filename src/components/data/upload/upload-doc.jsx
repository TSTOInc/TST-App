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
import { Progress } from "@/components/ui/progress"; // Assumes shadcn/ui progress component
import FileUpload from "@/components/file-upload";
import { IconPlus, IconLoader2, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";

export function DialogDemo({ title, maxFiles, maxSizeMB, entityType, entityId, category, expires = false, multiple = false, perFile = false, categories = [] }) {
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);
    
    // Tracks progress per file using its local unique identifier or index
    const [uploadProgress, setUploadProgress] = useState({});

    async function handleUpload() {
        if (!files.length) return;
        setLoading(true);
        // Reset progress mapping
        setUploadProgress({});

        try {
            const uploadPromises = files.map(async (fileWrapper, index) => {
                const fileToUpload = fileWrapper.file;
                const fileKey = fileWrapper.id || `${fileToUpload.name}-${index}`;

                // Set initial progress state for this file
                setUploadProgress(prev => ({ ...prev, [fileKey]: { name: fileToUpload.name, progress: 0, status: 'uploading' } }));

                // 1. Get the Presigned URL from your Next.js API
                const tokenRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: fileToUpload.name,
                        mimeType: fileToUpload.type,
                        size: fileToUpload.size,
                        category: perFile ? fileWrapper.category?.value : category,
                        entityType,
                        entityId,
                        expiresAt: expiresAt ? expiresAt.toISOString() : undefined
                    }),
                });

                if (!tokenRes.ok) {
                    setUploadProgress(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], status: 'error' } }));
                    throw new Error("Failed to get upload authorization");
                }
                const { fileId, uploadUrl, storageKey } = await tokenRes.json();

                // 2. Upload the file binary DIRECTLY via XMLHttpRequest to track progress hook
                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", uploadUrl);
                    xhr.setRequestHeader("Content-Type", fileToUpload.type);

                    // Track progress event
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percentage = Math.round((event.loaded / event.total) * 100);
                            setUploadProgress(prev => ({
                                ...prev,
                                [fileKey]: { ...prev[fileKey], progress: percentage }
                            }));
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(xhr.response);
                        } else {
                            reject(new Error("Direct storage upload failed"));
                        }
                    };
                    xhr.onerror = () => reject(new Error("Network error during upload"));
                    xhr.send(fileToUpload);
                }).catch(async (err) => {
                    setUploadProgress(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], status: 'error' } }));
                    // Fallback cleanup trigger
                    await fetch("/api/upload/cleanup", {
                        method: "POST",
                        body: JSON.stringify({ fileId })
                    });
                    throw err;
                });

                // Update status to finalizing
                setUploadProgress(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], progress: 100, status: 'finalizing' } }));

                // 3. Inform backend that the file was successfully saved
                const finalizeRes = await fetch("/api/upload/finalize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileId, storageKey })
                });

                if (!finalizeRes.ok) {
                    setUploadProgress(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], status: 'error' } }));
                    throw new Error("Finalize failed");
                }

                // Mark file as complete
                setUploadProgress(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], status: 'success' } }));
            });

            await Promise.all(uploadPromises);
            toast.success("All uploads successful");
            setFiles([]);
            setOpen(false);
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during upload.");
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

            <DialogContent className="sm:max-w-2xl w-full">
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

                {/* --- Progress Section --- */}
                {Object.keys(uploadProgress).length > 0 && (
                    <div className="mt-4 space-y-3 p-4 border rounded-lg bg-muted/20 max-h-48 overflow-y-auto">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload Progress</p>
                        {Object.entries(uploadProgress).map(([key, fileTrack]) => (
                            <div key={key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="truncate max-w-[70%] font-medium">{fileTrack.name}</span>
                                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                                        {fileTrack.status === 'uploading' && `${fileTrack.progress}%`}
                                        {fileTrack.status === 'finalizing' && (
                                            <>
                                                <IconLoader2 className="h-3 w-3 animate-spin text-primary" /> 
                                                Processing...
                                            </>
                                        )}
                                        {fileTrack.status === 'success' && (
                                            <>
                                                <IconCheck className="h-3 w-3 text-green-500" />
                                                Done
                                            </>
                                        )}
                                        {fileTrack.status === 'error' && <span className="text-destructive">Failed</span>}
                                    </span>
                                </div>
                                <Progress 
                                    value={fileTrack.progress} 
                                    className={`h-2 transition-all ${fileTrack.status === 'error' ? '[&>div]:bg-destructive' : ''}`}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={loading}>Cancel</Button>
                    </DialogClose>

                    <Button
                        onClick={handleUpload}
                        disabled={!files.length || (expires && !expiresAt) || loading}
                    >
                        {loading ? (
                            <>
                                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : "Upload"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}