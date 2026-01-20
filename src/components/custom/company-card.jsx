"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function CompanyCard({ table, id, title, description, image, status, skeleton, website }) {
    const link = `/${(table || "").replace(/_/g, "/")}/${id}`;

    if (skeleton)
        return (
            <Card className="rounded-xl border-none pt-0">
                <Skeleton className="aspect-video w-full rounded-t-xl rounded-b-none object-cover" />
                <CardHeader className="mb-2">
                    <CardTitle className="flex items-center justify-between">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5.5 w-8.5" />
                    </CardTitle>
                    <Skeleton className="h-5 w-2/4" />
                </CardHeader>
            </Card>
        )

    return (
        <Link href={link}>
            <Card className="border-none pt-0">
                <CardContent className="px-0">
                    <img
                        src={
                            image
                                ? image
                                : website
                                    ? `https://img.logo.dev/${website}?token=pk_eshRuE0_Q422ZDQhht9A-g&retina=true`
                                    : `https://placehold.co/600x400/2c2c2c/ffffff?font=montserrat&text=${encodeURIComponent(title || "No Image")}`
                        }
                        alt={title}
                        className="aspect-video w-full rounded-t-xl object-cover bg-neutral-200 dark:bg-neutral-800"
                    />

                </CardContent>

                <CardHeader className="mb-2">
                    <CardTitle className="flex items-center justify-between">
                        {title}
                        {status != "status" && <Badge onlyIcon status={status} />}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>

            </Card>
        </Link>

    )
}