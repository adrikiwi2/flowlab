import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getTenantById, createFlow, createCategory, createTemplate, createExtractField } from "@/lib/db";

function verifyAdmin(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

interface SeedCategory {
  name: string;
  color: string;
  rules: string;
}

interface SeedTemplate {
  name: string;
  body: string;
  category_index: number;
}

interface SeedField {
  field_name: string;
  field_type?: string;
  description?: string;
}

interface SeedPayload {
  tenant_id: string;
  flow_name?: string;
  flow_description?: string;
  system_prompt?: string;
  role_a_label?: string;
  role_b_label?: string;
  categories?: SeedCategory[];
  templates?: SeedTemplate[];
  extract_fields?: SeedField[];
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: SeedPayload = await request.json();
  const { tenant_id } = body;
  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const tenant = await getTenantById(tenant_id);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Create flow
  const flowId = nanoid();
  await createFlow({
    id: flowId,
    name: body.flow_name || "Sales Routing",
    description: body.flow_description || "Route inbound sales conversations",
  }, tenant_id);

  // Update system_prompt and role labels if provided
  if (body.system_prompt || body.role_a_label || body.role_b_label) {
    const { updateFlow } = await import("@/lib/db");
    await updateFlow(flowId, {
      system_prompt: body.system_prompt,
      role_a_label: body.role_a_label,
      role_b_label: body.role_b_label,
    }, tenant_id);
  }

  // Create categories
  const seedCategories = body.categories || [
    { name: "Hot Lead", color: "#22c55e", rules: "Customer shows clear purchase intent" },
    { name: "Warm Lead", color: "#f59e0b", rules: "Customer is interested but needs more info" },
    { name: "Cold / Not Interested", color: "#ef4444", rules: "Customer is not interested or unresponsive" },
  ];

  const catIds: string[] = [];
  for (const cat of seedCategories) {
    const id = nanoid();
    catIds.push(id);
    await createCategory({ id, flow_id: flowId, ...cat }, tenant_id);
  }

  // Create templates
  const seedTemplates = body.templates || [
    { name: "Warm Welcome", body: "Hi {{name}}, thanks for reaching out!", category_index: 1 },
    { name: "Hot Follow-up", body: "Great news, {{name}}! Let me get you set up.", category_index: 0 },
  ];

  for (const tpl of seedTemplates) {
    const categoryId = catIds[tpl.category_index] || null;
    await createTemplate({ id: nanoid(), flow_id: flowId, category_id: categoryId, name: tpl.name, body: tpl.body }, tenant_id);
  }

  // Create extract fields
  if (body.extract_fields) {
    for (const field of body.extract_fields) {
      await createExtractField({ id: nanoid(), flow_id: flowId, ...field }, tenant_id);
    }
  }

  return NextResponse.json({ ok: true, flow_id: flowId, categories: catIds.length, templates: seedTemplates.length }, { status: 201 });
}
