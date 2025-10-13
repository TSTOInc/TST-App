"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

const CompanyCard = ({ table, id, title, description, image, status, skeleton, website }) => {
    if (skeleton)
        return (
            <div className="rounded-xl border px-6 py-6 space-y-4">
                <Skeleton className="h-46 w-full rounded-lg" />
                <div className="space-y-3 mt-10 mb-8">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-full rounded-md" />
            </div>
        )

    return (
        <Card>
            <CardContent>
                <img
                    src={
                        image
                            ? image
                            : website
                                ? `https://img.logo.dev/${website}?token=pk_eshRuE0_Q422ZDQhht9A-g&retina=true`
                                : `https://placehold.co/600x400/2c2c2c/ffffff?font=montserrat&text=${encodeURIComponent(title || "No Image")}`
                    }
                    alt={title}
                    className="h-46 w-full object-cover mb-4 rounded-md bg-neutral-200 dark:bg-neutral-800"
                />

            </CardContent>

            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    {title}
                    {status != "status" && <Badge onlyIcon status={status} />}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                    <Link href={`${table}/${id}`}>
                        View {table.endsWith("s") ? table.charAt(0).toUpperCase() + table.slice(1, -1) : table.charAt(0).toUpperCase() + table.slice(1)}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default CompanyCard
