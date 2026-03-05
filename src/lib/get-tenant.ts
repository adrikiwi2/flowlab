import { headers } from "next/headers";

export async function getTenantId(): Promise<string> {
  const h = await headers();
  const tenantId = h.get("x-tenant-id");
  if (!tenantId) throw new Error("Unauthorized");
  return tenantId;
}
