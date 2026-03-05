import { NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const tenantId = await getTenantId();
  const { categoryId } = await params;
  const body = await request.json();
  const category = await updateCategory(categoryId, body, tenantId);
  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(category);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const tenantId = await getTenantId();
  const { categoryId } = await params;
  const deleted = await deleteCategory(categoryId, tenantId);
  if (!deleted) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
