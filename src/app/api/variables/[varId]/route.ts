import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/get-tenant";
import { updateFlowVariable, deleteFlowVariable } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ varId: string }> }
) {
  await getTenantId();
  const { varId } = await params;
  const data = (await request.json()) as { key?: string; value?: string };
  const variable = await updateFlowVariable(varId, data);
  return NextResponse.json(variable);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ varId: string }> }
) {
  const tenantId = await getTenantId();
  const { varId } = await params;
  await deleteFlowVariable(varId, tenantId);
  return NextResponse.json({ ok: true });
}
