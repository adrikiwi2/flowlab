# Provision a new tenant

## Steps

1. **Create the tenant** via the admin API:

```bash
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{
    "name": "Acme Corp",
    "email": "admin@acme.com",
    "password": "secure-password-here"
  }'
```

Save the returned `id` for the next step.

2. **(Optional) Seed sample data** for the tenant:

```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{ "tenant_id": "<tenant-id-from-step-1>" }'
```

3. **Share credentials** with the client:
   - URL: your deployment URL + `/login`
   - Email: the email used in step 1
   - Password: the password used in step 1

## Environment variables needed

- `ADMIN_SECRET` — must match the value in `.env.local` / Vercel env vars
- For production (Turso): set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`

## Notes

- Passwords are hashed with bcrypt (cost 12) before storage
- Each tenant gets isolated data — flows, categories, templates, simulations
- Tenants can be deactivated by setting `is_active = 0` in the database
