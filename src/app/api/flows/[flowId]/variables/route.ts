import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getTenantId } from "@/lib/get-tenant";
import { getFlowVariables, createFlowVariable } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  await getTenantId();
  const { flowId } = await params;
  const variables = await getFlowVariables(flowId);
  return NextResponse.json(variables);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  await getTenantId();
  const { flowId } = await params;
  const { key, value } = (await request.json()) as { key: string; value: string };
  const variable = await createFlowVariable({ id: nanoid(), flow_id: flowId, key: key || "variable", value: value || "" });
  return NextResponse.json(variable, { status: 201 });
}
