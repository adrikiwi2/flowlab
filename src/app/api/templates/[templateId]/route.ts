import { NextResponse } from "next/server";
import { updateTemplate, deleteTemplate } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const tenantId = await getTenantId();
  const { templateId } = await params;
  const body = await request.json();
  const template = await updateTemplate(templateId, body, tenantId);
  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(template);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const tenantId = await getTenantId();
  const { templateId } = await params;
  const deleted = await deleteTemplate(templateId, tenantId);
  if (!deleted) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
