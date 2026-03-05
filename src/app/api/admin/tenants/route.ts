import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { createTenant, getTenantByEmail } from "@/lib/db";

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

  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password required" }, { status: 400 });
  }

  const existing = await getTenantByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const tenant = await createTenant({ id: nanoid(), name, email, password_hash });

  return NextResponse.json(
    { id: tenant.id, name: tenant.name, email: tenant.email, created_at: tenant.created_at },
    { status: 201 }
  );
}
