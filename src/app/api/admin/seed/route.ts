import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getTenantById, createFlow, createCategory, createTemplate } from "@/lib/db";

function verifyAdmin(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenant_id } = await request.json();
  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const tenant = await getTenantById(tenant_id);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Create a sample flow
  const flowId = nanoid();
  await createFlow({ id: flowId, name: "Sales Routing", description: "Route inbound sales conversations" }, tenant_id);

  // Create sample categories
  const categories = [
    { name: "Hot Lead", color: "#22c55e", rules: "Customer shows clear purchase intent" },
    { name: "Warm Lead", color: "#f59e0b", rules: "Customer is interested but needs more info" },
    { name: "Cold / Not Interested", color: "#ef4444", rules: "Customer is not interested or unresponsive" },
  ];

  const catIds: string[] = [];
  for (const cat of categories) {
    const id = nanoid();
    catIds.push(id);
    await createCategory({ id, flow_id: flowId, ...cat }, tenant_id);
  }

  // Create sample templates
  const templates = [
    { name: "Warm Welcome", body: "Hi {{name}}, thanks for reaching out! I'd love to learn more about your needs.", category_id: catIds[1] },
    { name: "Hot Follow-up", body: "Great news, {{name}}! Let me get you set up right away.", category_id: catIds[0] },
  ];

  for (const tpl of templates) {
    await createTemplate({ id: nanoid(), flow_id: flowId, ...tpl }, tenant_id);
  }

  return NextResponse.json({ ok: true, flow_id: flowId }, { status: 201 });
}
