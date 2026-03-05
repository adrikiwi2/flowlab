import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createCategory } from "@/lib/db";
import { getTenantId } from "@/lib/get-tenant";

export async function POST(request: Request) {
  const tenantId = await getTenantId();
  const body = await request.json();
  const { flow_id, name, color, rules } = body;

  if (!flow_id || !name) {
    return NextResponse.json(
      { error: "flow_id and name are required" },
      { status: 400 }
    );
  }

  const category = await createCategory(
    { id: nanoid(), flow_id, name, color, rules },
    tenantId
  );
  if (!category) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }
  return NextResponse.json(category, { status: 201 });
}
