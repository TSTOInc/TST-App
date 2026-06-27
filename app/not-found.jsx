import React from 'react'
import Link from 'next/link'
import { SearchIcon } from "lucide-react"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from "@/components/ui/empty"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

const NotFound = () => {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyTitle className="text-2xl">404 - Not Found</EmptyTitle>
                <EmptyDescription>
                    The page you&apos;re looking for doesn&apos;t exist. Try searching for
                    what you need below.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <InputGroup className="sm:w-3/4">
                    <InputGroupInput placeholder="Try searching for pages..." />
                    <InputGroupAddon>
                        <SearchIcon />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                        <Kbd>/</Kbd>
                    </InputGroupAddon>
                </InputGroup>
                <EmptyDescription>
                    Need help? <a href="#">Contact support</a>
                </EmptyDescription>
            </EmptyContent>
        </Empty>
    )
}

export default NotFound