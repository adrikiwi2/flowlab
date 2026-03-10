import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getKnowledgeDocsByFlow, createKnowledgeDoc } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function GET(request: Request) {
  const tenantId = await getTenantId();
  const { searchParams } = new URL(request.url);
  const flowId = searchParams.get("flow_id");
  if (!flowId) {
    return NextResponse.json({ error: "flow_id required" }, { status: 400 });
  }
  const docs = await getKnowledgeDocsByFlow(flowId, tenantId);
  return NextResponse.json(docs);
}

export async function POST(request: Request) {
  const tenantId = await getTenantId();
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const flowId = formData.get("flow_id") as string;
    const name = formData.get("name") as string;
    const file = formData.get("file") as File | null;

    if (!flowId || !name || !file) {
      return NextResponse.json(
        { error: "flow_id, name, and file are required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const b64 = buffer.toString("base64");

    const doc = await createKnowledgeDoc(
      { id: nanoid(), flow_id: flowId, name, doc_type: "pdf", content_pdf_b64: b64 },
      tenantId
    );
    if (!doc) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }
    return NextResponse.json(doc, { status: 201 });
  }

  // JSON body for text docs
  const body = await request.json();
  const { flow_id, name, content_text } = body;

  if (!flow_id || !name) {
    return NextResponse.json(
      { error: "flow_id and name are required" },
      { status: 400 }
    );
  }

  const doc = await createKnowledgeDoc(
    { id: nanoid(), flow_id, name, doc_type: "text", content_text: content_text || "" },
    tenantId
  );
  if (!doc) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }
  return NextResponse.json(doc, { status: 201 });
}
