import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const NotFound = () => {
    return (
        <main className="flex flex-col justify-center items-center h-full text-center p-8 flex-grow">
            <h1 className="text-9xl font-bold mb-4">404</h1>
            <p className="text-xl mb-8">Oops, the page you’re looking for doesn’t exist.</p>
            <Link href="/dashboard">
                <Button>Go back to Dashboard</Button>
            </Link>
        </main>
    )
}

export default NotFound