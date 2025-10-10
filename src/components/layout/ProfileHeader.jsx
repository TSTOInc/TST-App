"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColorBadge } from "@/components/ui/color-badge";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import FieldRenderer from "@/components/custom/FieldRenderer";


export default function ProfileHeader({
    id,
    table,
    name,
    alias,
    image_url,
    role,
    company,
    link,
    website,
    status,
    color,
    data
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        if (!id) {
            toast.error("No ID provided");
            return;
        }

        try {
            await toast.promise(
                fetch(`/api/delete/${table}/${id}`, {
                    cache: "no-cache",
                    method: "DELETE",
                }).then(async (res) => {
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(text || "Failed to delete item");
                    }

                    const data = await res.json();
                    router.back();
                    return data;
                }),
                {
                    loading: "Deleting item...",
                    success: "Item deleted successfully!",
                    error: (err) => `Error deleting item: ${err.message}`,
                }
            );
        } catch (err) {
            console.error("Delete error:", err);
            throw err;
        }
    };

    const fields = Object.entries(data || {})
        .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
        .map(([key, value]) => {
            // determine type dynamically
            let type = "text";
            let options = undefined;

            if (key === "status") {
                type = "status";
                options = [
                    { value: "pending", label: "Pending" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                ];
            } else if (["image_url", "license_url"].includes(key)) {
                type = "file";
            }

            return { key, value, type, options };
        });


    return (
        <header className="w-full rounded-b-xl shadow-sm overflow-hidden pb-4">
            {/* Cover */}
            <div className="relative h-48 sm:h-56 w-full">
                <img
                    src={`https://placehold.co/1920x600/2c2c2c/ffffff?font=montserrat&text=${encodeURIComponent(
                        name + (alias ? ` ${alias}` : "")
                    )}`}
                    alt="cover"
                    className="w-full h-full object-cover bg-neutral-950"
                />
            </div>

            {/* Profile Info */}
            <div className="max-w-8xl mx-auto px-4 z-10 relative">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-20 sm:-mt-16">
                    {/* Avatar */}
                    <div className="flex justify-center sm:justify-start">
                        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full shadow-md">
                            <Avatar className="w-full h-full">
                                <AvatarImage
                                    src={
                                        image_url
                                            ? image_url
                                            : `https://img.logo.dev/${website}?token=pk_eshRuE0_Q422ZDQhht9A-g`
                                    }
                                    alt={name}
                                    className="w-full h-full"
                                />
                                <AvatarFallback fullsize>{name}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    {/* Text + Buttons container */}
                    <div className="flex flex-1 flex-col sm:flex-row sm:justify-between sm:items-end text-center sm:text-left gap-2 pb-7">
                        {/* Left: Text */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">
                                <span>{name} <span className="text-muted-foreground font-semibold italic">{alias} </span></span>

                                {status && <Badge onlyIcon status={status} />}
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                {color && <ColorBadge color={color} />}
                                {role}
                                {company && (
                                    <>
                                        {role && <span> | </span>}
                                        <Link href={`/${link ? link : "#"}`} className="underline">
                                            {company}
                                        </Link>
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Right: Buttons */}
                        <div className="flex gap-2 justify-center sm:justify-start">
                            <Dialog>
                                <DialogTrigger>
                                    <Button variant="outline">
                                        <IconEdit />
                                        Edit
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="max-h-[80vh] flex flex-col">
                                    {/* Header stays pinned at the top */}
                                    <DialogHeader className="shrink-0 sticky top-0 bg-background pb-2">
                                        <DialogTitle>Edit {table}</DialogTitle>
                                    </DialogHeader>

                                    {/* Scrollable body */}
                                    <div className="overflow-y-auto pr-2 flex-1 space-y-4">
                                        {fields.map((field) => (
                                            <FieldRenderer
                                                key={field.key}
                                                field={field}
                                                onChange={(key, value) => {
                                                    // update fields dynamically
                                                    const f = fields.find((f) => f.key === key);
                                                    if (f) f.value = value;
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Sticky footer */}
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button type="submit">
                                                Save
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>






                            {/* Delete with AlertDialog */}
                            <AlertDialog open={open} onOpenChange={setOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <IconTrash />
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete <strong>{name}</strong>? This action cannot
                                            be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction asChild>
                                            <Button variant="destructive" className="text-white" onClick={handleDelete}>
                                                <IconTrash />
                                                Delete
                                            </Button>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
