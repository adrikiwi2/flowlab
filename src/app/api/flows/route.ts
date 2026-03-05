import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getAllFlows, createFlow } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function GET() {
  const tenantId = await getTenantId();
  const flows = await getAllFlows(tenantId);
  return NextResponse.json(flows);
}

export async function POST(request: Request) {
  const tenantId = await getTenantId();
  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const flow = await createFlow({ id: nanoid(), name, description }, tenantId);
  return NextResponse.json(flow, { status: 201 });
}
