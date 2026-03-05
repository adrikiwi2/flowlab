import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createExtractField } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function POST(request: Request) {
  const tenantId = await getTenantId();
  const body = await request.json();
  const { flow_id, field_name, field_type, description } = body;

  if (!flow_id || !field_name) {
    return NextResponse.json(
      { error: "flow_id and field_name are required" },
      { status: 400 }
    );
  }

  const field = await createExtractField(
    { id: nanoid(), flow_id, field_name, field_type, description },
    tenantId
  );
  if (!field) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }
  return NextResponse.json(field, { status: 201 });
}
