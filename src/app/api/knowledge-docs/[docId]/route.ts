import { NextResponse } from "next/server";
import { updateKnowledgeDoc, deleteKnowledgeDoc, getKnowledgeDocById } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const tenantId = await getTenantId();
  const { docId } = await params;
  const doc = await getKnowledgeDocById(docId, tenantId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json(doc);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const tenantId = await getTenantId();
  const { docId } = await params;
  const body = await request.json();
  const doc = await updateKnowledgeDoc(docId, body, tenantId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json(doc);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const tenantId = await getTenantId();
  const { docId } = await params;
  const deleted = await deleteKnowledgeDoc(docId, tenantId);
  if (!deleted) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
