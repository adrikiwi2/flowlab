import { NextResponse } from "next/server";
import { getFlowById } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";
import { classifyConversation } from "@/lib/router";
import type { SimMessage } from "@/lib/types";

export async function POST(request: Request) {
  const tenantId = await getTenantId();
  const body = await request.json();
  const { flow_id, messages } = body as {
    flow_id: string;
    messages: SimMessage[];
  };

  if (!flow_id || !messages || messages.length === 0) {
    return NextResponse.json(
      { error: "flow_id and non-empty messages array required" },
      { status: 400 }
    );
  }

  const flow = await getFlowById(flow_id, tenantId);
  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  if (flow.categories.length === 0) {
    return NextResponse.json(
      { error: "Flow has no categories defined. Add at least one category before running inference." },
      { status: 400 }
    );
  }

  try {
    const result = await classifyConversation(flow, messages);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Inference failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
