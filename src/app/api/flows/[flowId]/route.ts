import { NextResponse } from "next/server";
import { getFlowById, updateFlow, deleteFlow } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const tenantId = await getTenantId();
  const { flowId } = await params;
  const flow = await getFlowById(flowId, tenantId);
  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }
  return NextResponse.json(flow);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const tenantId = await getTenantId();
  const { flowId } = await params;
  const body = await request.json();
  const flow = await updateFlow(flowId, body, tenantId);
  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }
  return NextResponse.json(flow);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const tenantId = await getTenantId();
  const { flowId } = await params;
  const deleted = await deleteFlow(flowId, tenantId);
  if (!deleted) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
