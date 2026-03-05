import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/get-tenant";
import { getTenantById } from "@/lib/db";

export async function GET() {
  try {
    const tenantId = await getTenantId();
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    return NextResponse.json({ id: tenant.id, name: tenant.name, email: tenant.email });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
