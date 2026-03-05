import { NextResponse } from "next/server";
import {
  getSimulationById,
  updateSimulation,
  deleteSimulation,
} from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ simId: string }> }
) {
  const tenantId = await getTenantId();
  const { simId } = await params;
  const sim = await getSimulationById(simId, tenantId);
  if (!sim) {
    return NextResponse.json(
      { error: "Simulation not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(sim);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ simId: string }> }
) {
  const tenantId = await getTenantId();
  const { simId } = await params;
  const body = await request.json();
  const sim = await updateSimulation(simId, body, tenantId);
  if (!sim) {
    return NextResponse.json(
      { error: "Simulation not found" },
      { status: 404 }
    );
  }
  return NextResponse.json(sim);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ simId: string }> }
) {
  const tenantId = await getTenantId();
  const { simId } = await params;
  const deleted = await deleteSimulation(simId, tenantId);
  if (!deleted) {
    return NextResponse.json(
      { error: "Simulation not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
