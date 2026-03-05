import { NextResponse } from "next/server";
import { updateExtractField, deleteExtractField } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const tenantId = await getTenantId();
  const { fieldId } = await params;
  const body = await request.json();
  const field = await updateExtractField(fieldId, body, tenantId);
  if (!field) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }
  return NextResponse.json(field);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const tenantId = await getTenantId();
  const { fieldId } = await params;
  const deleted = await deleteExtractField(fieldId, tenantId);
  if (!deleted) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
