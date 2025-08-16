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
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        if (!id) {
            toast.error("No ID provided");
            return;
        }

        try {
            const res = await fetch(`https://tst.api.incashy.com/delete/${table}/${id}`, {
                cache: "no-cache",
                method: "DELETE",
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to delete item");
            }

            const data = await res.json();
            toast.success("Item deleted successfully!");
            router.back();
            return data;
        } catch (err) {
            console.error("Delete error:", err);
            toast.error(`Error deleting item: ${err.message}`);
            throw err;
        }
    };

    return (
        <header className="w-full rounded-b-xl shadow-sm overflow-hidden pb-8">
            {/* Cover */}
            <div className="relative h-48 sm:h-56 w-full">
                <img
                    src={`https://placehold.co/1920x600/C9E4FF/1B6DC1?font=montserrat&text=${encodeURIComponent(
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
                                <AvatarFallback>{name}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    {/* Text + Buttons container */}
                    <div className="flex flex-1 flex-col sm:flex-row sm:justify-between sm:items-end text-center sm:text-left gap-2 pb-7">
                        {/* Left: Text */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">
                                {name}
                                <span className="text-neutral-400 font-semibold italic"> {alias}</span>
                                {status && <Badge onlyIcon status={status} />}
                            </h1>
                            <p className="text-neutral-400 text-sm sm:text-base">
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
                            <Button variant="outline">
                                <IconEdit />
                                Edit
                            </Button>

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
