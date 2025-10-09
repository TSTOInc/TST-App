import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";


export async function POST(req, { params }) {
    const { table, record } = params
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) return NextResponse.json({ error: "No file uploaded" }, 400);

    const uploaded = await put(`${table}/${record}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return NextResponse.json({ url: uploaded.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, 204);
}
