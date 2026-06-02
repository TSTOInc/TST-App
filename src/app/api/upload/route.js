import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    const { isAuthenticated, getToken } = await auth();
    if (!isAuthenticated) return new Response('Unauthorized', { status: 401 });
    
    const token = await getToken({ template: 'convex' });
    convex.setAuth(token);

    // Expecting JSON metadata instead of raw file streams
    const { filename, mimeType, size, category, entityType, entityId, expiresAt } = await req.json();

    // 1. Reserve the record in Convex
    const fileId = await convex.mutation(api.files.createUpload, {
        file: { filename, mimeType, size, category, entityType, entityId, expiresAt }
    });

    const pathname = `${category}/${crypto.randomUUID()}-${filename}`;

    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        
        // 2. Ask Supabase for a short-lived signed upload URL (e.g., valid for 60 seconds)
        const { data, error } = await supabase.storage
            .from('TST')
            .createSignedUploadUrl(pathname);

        if (error) throw error;

        // Return the signed URL and the storage token back to the client
        return NextResponse.json({
            fileId,
            uploadUrl: data.signedUrl, 
            storageKey: pathname
        });

    } catch (err) {
        await convex.mutation(api.files.failedUpload, { id: fileId });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}