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
        <Link href={link} className="group block transition-transform duration-200 ease-in-out hover:scale-[1.01]">
            <Card className="border-none pt-0">
                <CardContent className="px-0 relative overflow-hidden rounded-t-xl">
                    <img
                        src={
                            image
                                ? image
                                : website
                                    ? `https://img.logo.dev/${website}?token=pk_eshRuE0_Q422ZDQhht9A-g&retina=true`
                                    : `https://placehold.co/600x400/2c2c2c/ffffff?font=montserrat&text=${encodeURIComponent(title || "No Image")}`
                        }
                        alt={title}
                        className="absolute inset-0 w-full object-cover scale-110 blur-3xl pointer-events-none"
                    />
                    <img
                        src={
                            image
                                ? image
                                : website
                                    ? `https://img.logo.dev/${website}?token=pk_eshRuE0_Q422ZDQhht9A-g&retina=true`
                                    : `https://placehold.co/600x400/2c2c2c/ffffff?font=montserrat&text=${encodeURIComponent(title || "No Image")}`
                        }
                        alt={title}
                        className="relative z-10 w-full aspect-video object-contain scale-200 rounded-t-xl group-hover:scale-100 transition-transform duration-300 ease-in-out"
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