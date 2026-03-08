# FlowLab

Plataforma multi-tenant para disenar, simular y ejecutar flujos de conversacion con IA sobre canales reales (Instagram, WhatsApp).

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS 4, Lucide icons. Dark theme. Sin librerias de componentes.
- **DB:** SQLite via @libsql/client (local: `file:flowlab.db`, prod: Turso)
- **Auth:** JWT (jose) + bcryptjs. Cookie-based para web, Bearer token para clientes externos (agente local).
- **LLM:** Google Gemini (`gemini-3.1-flash-lite-preview`) via @google/generative-ai
- **IDs:** nanoid

## Arquitectura

```
src/
  app/
    (dashboard)/          # Layout con Sidebar colapsable
      flow/[flowId]/      # Pestanas: Designer | Simulate
      page.tsx            # Dashboard root
    api/
      admin/              # tenants (POST), seed (POST) — protegidos con ADMIN_SECRET
      auth/               # login, logout, me, token (Bearer para clientes externos)
      flows/              # CRUD flows
      categories/         # CRUD categories
      extract-fields/     # CRUD extract fields
      templates/          # CRUD templates
      inference/          # POST — clasificacion con Gemini
      simulations/        # CRUD simulations
    login/                # Login page
  components/
    sidebar.tsx           # Panel lateral colapsable (minimizado por defecto)
    flow-designer.tsx     # Categorias + templates inline + extract fields
    simulation-panel.tsx  # Chat simulado + inferencia multiple + persistencia
    ai-result-card.tsx    # Tarjeta resultado inferencia (colapsable con ?) + banner needs_human
    agent-config-panel.tsx # Panel read-only de agent_config (stages, flags, policy rules)
    chat-bubble.tsx       # Burbuja de mensaje
    role-switcher.tsx     # Switcher rol A/B/inference
  lib/
    db.ts                 # Conexion SQLite, schema, queries, migraciones
    auth.ts               # JWT sign/verify, cookies
    get-tenant.ts         # Extraer tenant_id de cookie o Bearer header
    router.ts             # classifyConversation() — llama a Gemini
    prompt-builder.ts     # Construye prompt con categorias, templates, fields + needs_human
    types.ts              # Interfaces TypeScript
```

## Modelo de datos

### Core (diseño de flujos)
- **Tenant** → tiene muchos Flows (aislamiento total)
- **Flow** → tiene Categories, ExtractFields, Templates, Simulations. Columna `agent_config` (JSON, nullable, admin-only).
- **Category** → reglas de clasificacion, color. Tiene Templates asociados.
- **Template** → body con variables {{var}}, vinculado a una Category
- **ExtractField** → campo que Gemini debe extraer de la conversacion
- **Simulation** → mensajes (JSON blob) + mapa de inferencias (msgId → InferenceResult)

### Agent (conversaciones reales)
- **Lead** → contacto descubierto por canal, vinculado a tenant + flow. Flags `needs_human` y `stage`.
- **Message** → mensaje in/out de un lead, con resultado de inferencia opcional.
- **ConversationState** → stage + flags JSON + contadores por lead.
- **Outbox** → cola de envio con retry e idempotency key.
- **LeadEvent** → audit trail de cambios de stage y acciones.

## Autenticacion

- **Web (UI):** Cookie HttpOnly `flowlab_token` (JWT HS256, 30 dias). Set via `POST /api/auth/login`.
- **Clientes externos (agente local):** `POST /api/auth/token` devuelve JWT como JSON. Usar con header `Authorization: Bearer <token>`.
- **Middleware:** acepta cookie o Bearer token. Inyecta `x-tenant-id` en headers para downstream.
- **Admin:** endpoints `/api/admin/*` usan `Authorization: Bearer ADMIN_SECRET`.

## Flujo de inferencia

1. Frontend envia `POST /api/inference` con `{ flow_id, messages }`
2. Backend carga el flow completo (categorias, templates, fields)
3. `prompt-builder.ts` construye prompt con: system_prompt + conversacion + reglas + templates agrupados por categoria + fields + instruccion needs_human
4. Gemini responde JSON: `{ detected_status, reasoning, needs_human, needs_human_reason, extracted_info, suggested_template_id }`
5. Si hay template sugerido: se inserta como mensaje del rol A con tarjeta de decision
6. Si no hay template (ej: needs_human): resultado se adjunta al ultimo mensaje del cliente

## agent_config

Columna JSON en `flows`, admin-only. Define como el agente local procesa conversaciones reales.
Documentacion completa: `.hub/tasks/set-agent-config.md`

```json
{
  "channel": "instagram",
  "mode": "outreach",
  "stages": ["outreach_sent", "replied", "engaged", "converted", "needs_human"],
  "initial_stage": "outreach_sent",
  "flags": ["cta_sent"],
  "policy_rules": [{ "when": {...}, "then": {...} }],
  "max_interactions": 4,
  "confidence_threshold": 0.7
}
```

## Comandos

```bash
npm run dev       # Servidor desarrollo (localhost:3000)
npm run build     # Build produccion
npm run start     # Servidor produccion
npm run lint      # ESLint
```

## Convenciones

- Todas las rutas API validan tenant_id desde cookie JWT o Bearer token
- Los endpoints admin usan Bearer token (ADMIN_SECRET)
- Los componentes usan `"use client"` cuando tienen estado
- Edicion inline con blur-to-save (sin boton guardar explicito)
- Las simulaciones persisten multiples inferencias en `last_result_json` como mapa `{ msgId: InferenceResult }`
- `needs_human` es un flag de sistema ortogonal a las categories — el LLM siempre lo evalua
- `agent_config` es null por defecto (flow solo simulacion). Con valor → flow ejecutable por agente local
