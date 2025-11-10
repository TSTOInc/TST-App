"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColorBadge } from "@/components/ui/color-badge";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import FieldRenderer from "@/components/custom/FieldRenderer";
import LinkButton from "@/components/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from '@clerk/nextjs'
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";


export default function ProfileHeader({
    skeleton = false,
    table,
    name,
    alias,
    image_url,
    description,
    link,
    status,
    color,
    data,
}) {

    if (skeleton) {
        return (
            <header className="w-full rounded-b-xl overflow-hidden pb-4">
                {/* Cover */}
                <div className="relative h-48 sm:h-56 w-full">
                    <Skeleton className="w-full h-full rounded-none" />
                </div>

                {/* Profile Info */}
                <div className="max-w-8xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-20 sm:-mt-16">
                        {/* Avatar */}
                        <div className="flex justify-center sm:justify-start">
                            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full shadow-md sm:shadow-none">
                                <Avatar className="w-full h-full border-6 border-background bg-background">
                                    <Skeleton className="w-full h-full rounded-full" />
                                </Avatar>
                            </div>
                        </div>

                        {/* Info + Buttons */}
                        <div className="flex flex-1 flex-col sm:flex-row sm:justify-between sm:items-end text-center sm:text-left gap-2 pb-7">
                            {/* Info */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <Skeleton className="h-7 w-64 rounded-lg" />
                                    <Skeleton className="h-7 w-10 rounded-lg" />
                                </div>

                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <Skeleton className="h-4 w-32 rounded-sm" />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2 justify-center sm:justify-start">
                                <Skeleton className="h-9 w-24 rounded-lg" />
                                <Skeleton className="h-9 w-24 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    const { organization } = useOrganization();
    const orgID = organization ? organization.id : "";
    const deleteDoc = useMutation(api.delete.byId);

    const router = useRouter();
    const [open, setOpen] = useState(false);

    /** 🔥 Delete logic */
    const handleDelete = async () => {
        if (!data._id || !table) {
            toast.error("Missing ID or table name");
            return;
        }

        try {
            await toast.promise(deleteDoc({ id: data._id, table: table, orgId: orgID }),
                {
                    loading: "Deleting...",
                    success: "Deleted successfully!",
                    error: (err) => `Error: ${err.message}`,
                }
            );

            router.push(`/${table}`);
        } catch (err) {
            console.error(err);
        }
    };

    /** ✏️ Field list */
    const fields =
        Object.entries(data || {})
            .filter(([k]) => !["id", "created_at", "updated_at"].includes(k))
            .map(([key, value]) => ({
                key,
                value,
                type:
                    key === "status"
                        ? "status"
                        : ["image_url", "license_url"].includes(key)
                            ? "file"
                            : "text",
            })) || [];

    return (
        <div className="w-full rounded-b-xl overflow-hidden pb-4">
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
                        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full shadow-md sm:shadow-none">
                            <Avatar className="w-full h-full bg-background">
                                <AvatarImage fullsize
                                    src={image_url || `https://img.logo.dev/${data.website}?token=pk_eshRuE0_Q422ZDQhht9A-g&retina=true`}
                                    alt={name}
                                />
                                <AvatarFallback fullsize>{name}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    {/* Info + CRUD Buttons */}
                    <div className="flex flex-1 flex-col sm:flex-row sm:justify-between sm:items-end text-center sm:text-left gap-2 pb-7">
                        {/* Info */}
                        <div>
                            <h1 className="flex items-center justify-center sm:justify-start gap-2 text-2xl sm:text-3xl font-bold">
                                <span>{name}</span>
                                {alias && (
                                    <span className="text-muted-foreground font-semibold italic">{alias}</span>
                                )}
                                {status && <Badge onlyIcon status={status} />}
                            </h1>

                            <p className="text-muted-foreground text-sm sm:text-base mt-1 flex items-center justify-center sm:justify-start gap-2">
                                {color && <ColorBadge color={color} />}
                                {description && <span>{description}</span>}
                                {link && (
                                    <LinkButton href={link} external={false}/>
                                )}
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 justify-center sm:justify-start">
                            {/* Edit Dialog */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <IconEdit /> Edit
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="max-h-[80vh] flex flex-col">
                                    <DialogHeader className="shrink-0 sticky top-0 bg-background pb-2">
                                        <DialogTitle>Edit {table}</DialogTitle>
                                    </DialogHeader>

                                    <div className="overflow-y-auto pr-2 flex-1 space-y-4">
                                        {fields.map((field) => (
                                            <FieldRenderer
                                                key={field.key}
                                                field={field}
                                                onChange={(key, value) => {
                                                    const f = fields.find((f) => f.key === key);
                                                    if (f) f.value = value;
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button>Save</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Delete Dialog */}
                            <AlertDialog open={open} onOpenChange={setOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <IconTrash /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete{" "}
                                            <strong>{name}</strong>? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction asChild>
                                            <Button
                                                variant="destructive"
                                                className="text-white"
                                                onClick={handleDelete}
                                            >
                                                <IconTrash /> Delete
                                            </Button>
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
