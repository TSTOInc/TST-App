import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { any } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    const { isAuthenticated, getToken } = await auth()
    if (!isAuthenticated) {
        return new Response('Unauthorized', { status: 401 })
    }
    const token = await getToken({ template: 'convex' })
    convex.setAuth(token)
    const formData = await req.formData();
    const file = formData.get("file");
    const category = formData.get("category");
    const entityType = formData.get("entityType");
    const entityId = formData.get("entityId");
    const expiresAtRaw = formData.get("expiresAt");
    const expiresAt =
        typeof expiresAtRaw === "string"
            ? new Date(expiresAtRaw).getTime()
            : undefined;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 🔐 basic validation
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Create record in Convex
    const fileId = await convex.mutation(api.files.createUpload, {
        file: {
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            category: category,
            entityType: entityType,
            entityId: entityId,
            expiresAt: expiresAt,
        },
    });

    const pathname = `${category}/${crypto.randomUUID()}-${file.name}`;

    try {
        // 🚀 Upload to Supabase Blob Storage
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        const { data, error } = await supabase.storage
            .from('TST')
            .upload(pathname, file, {
                cacheControl: '3600',
                upsert: false
            })
        if (error) {
            throw error;
        }

        // Update Convex record with storage key and finalize
        await convex.mutation(api.files.finalizeUpload, {
            id: fileId,
            storageKey: data.path,
        });

        return NextResponse.json({
            id: fileId,
            storageKey: data.path,
        });

    } catch (err) {
        await convex.mutation(api.files.failedUpload, { id: fileId }); // cleanup Convex record on failure
        await supabase.storage.from('TST').remove([pathname]);
        throw err; 
    }
}
