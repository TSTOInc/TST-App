import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { any } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    const { isAuthenticated, getToken, orgId } = await auth()
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
            : null;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 🔐 basic validation
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const pathname = `${category}/${crypto.randomUUID()}-${file.name}`;

    // 🚀 Upload to Supabase Blob Storage
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data, error } = await supabase.storage
        .from('TST')
        .upload(pathname, file, {
            cacheControl: '3600',
            upsert: false
        })
    if (error) {
        console.error("Supabase upload error:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Save record in Convex
    const fileId = await convex.mutation(api.files.create, {
        file: {
            storageKey: data.path,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            category: category,
            entityType: entityType,
            entityId: entityId,
            expiresAt: expiresAt,
            org_id: orgId,
        },
    });

    return NextResponse.json({
        id: fileId,
        storageKey: data.path,
    });
}
