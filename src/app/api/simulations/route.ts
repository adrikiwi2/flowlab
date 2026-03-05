import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSimulationsByFlow, createSimulation } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function GET(request: Request) {
  const tenantId = await getTenantId();
  const { searchParams } = new URL(request.url);
  const flowId = searchParams.get("flow_id");

  if (!flowId) {
    return NextResponse.json(
      { error: "flow_id query param required" },
      { status: 400 }
    );
  }

  const simulations = await getSimulationsByFlow(flowId, tenantId);
  return NextResponse.json(simulations);
}

export async function POST(request: Request) {
  const tenantId = await getTenantId();
  const body = await request.json();
  const { flow_id, title } = body;

  if (!flow_id) {
    return NextResponse.json(
      { error: "flow_id is required" },
      { status: 400 }
    );
  }

  const simulation = await createSimulation({ id: nanoid(), flow_id, title }, tenantId);
  if (!simulation) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }
  return NextResponse.json(simulation, { status: 201 });
}
