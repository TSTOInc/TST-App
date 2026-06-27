import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    const { isAuthenticated, getToken } = await auth();
    if (!isAuthenticated) return new Response('Unauthorized', { status: 401 });

    const token = await getToken({ template: 'convex' });
    convex.setAuth(token);

    const { fileId } = await req.json();

    try {
        // Run your existing failure mutation to clean up Convex
        await convex.mutation(api.files.failedUpload, { id: fileId });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Cleanup error:", err);
        return NextResponse.json({ error: "Failed to clean up record" }, { status: 500 });
    }
}