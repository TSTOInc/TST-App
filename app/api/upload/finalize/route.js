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

    const { fileId, storageKey } = await req.json();

    try {
        // Update Convex record with storage key and finalize
        await convex.mutation(api.files.finalizeUpload, {
            id: fileId,
            storageKey: storageKey,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Finalize error:", err);
        return NextResponse.json({ error: "Failed to finalize upload" }, { status: 500 });
    }
}