---
title: Alert Engine — Motor de alertas multi-canal configurable
status: in_progress
priority: high
tags: [alert-engine, whatsapp, iberoexpress, multi-tenant]
---

## Objetivo

Construir un motor de alertas configurable por tenant que permita disparar notificaciones a cualquier canal (WhatsApp, Slack, webhook, email) cuando ocurren eventos en FlowLab (inferencias, leads cualificados, needs_human, etc.). Reemplaza el enfoque anterior (notificacion hardcoded a un grupo fijo).

## Arquitectura

```
agent-cycle.ts
  → alertDispatcher(tenantId, flowId, eventType, payload)
    → busca alert_rules activas para ese tenant + flow + evento
    → evalua conditions (si las hay)
    → renderiza template con payload
    → POST /send a notification-service por cada destination
```

```
FlowLab (Vercel)                     Notification Service (portátil + Cloudflare Tunnel)
─────────────────                    ──────────────────────────────────────────────────
alert_destinations (DB)              POST /notify { to: jid, message }
alert_rules (DB)             ──→     GET  /chats  (buscar JIDs)
alert_logs (DB)                      GET  /health
alert-dispatcher.ts
```

> **Arquitectura real**: el servidor puente corre en el portátil de la oficina (Node.js + wacli), expuesto via Cloudflare Tunnel. La URL cambia en cada sesión — actualizar `NOTIFY_SERVICE_URL` en Vercel cuando eso ocurra. NO está en Fly.io.

## Modelo de datos (3 tablas nuevas en FlowLab)

### alert_destinations — "Los enchufes"
Canales de comunicacion. Un destino puede usarse en N reglas.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | TEXT PK | nanoid |
| tenant_id | TEXT FK | Aislamiento por tenant |
| name | TEXT | Ej: "Grupo Comerciales Madrid" |
| provider | TEXT | `whatsapp` / `slack` / `webhook` / `email` |
| config | TEXT (JSON) | `{"jid":"1234@g.us"}` o `{"url":"https://..."}` |
| is_active | INTEGER | 1 por defecto. Apagar sin borrar. |

### alert_rules — "El cerebro"
Une flow + evento + condicion + template + destino.

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | TEXT PK | nanoid |
| tenant_id | TEXT FK | Aislamiento por tenant |
| flow_id | TEXT FK | Flow especifico que dispara la regla |
| event_type | TEXT | `lead.qualified`, `needs_human`, `message.received`, `inference.executed`, `message.sent` |
| conditions | TEXT (JSON) | Ej: `{"field":"zone","op":"==","value":"Madrid"}`. Null = siempre |
| template | TEXT | Ej: `🟢 Lead de {{name}} en {{zone}}. Tel: {{phone}}` |
| destination_id | TEXT FK | Apunta a alert_destinations.id |
| is_active | INTEGER | 1 por defecto |

### alert_logs — "El historial"
Audit trail para depuracion ("no me llego el WhatsApp").

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | TEXT PK | nanoid |
| rule_id | TEXT FK | Que regla disparo este log |
| status | TEXT | `success` / `error` |
| payload | TEXT (JSON) | Datos enviados o error devuelto |
| created_at | TEXT | ISO timestamp |

## Catalogo de eventos

| Evento | Cuando se dispara |
|--------|-------------------|
| `message.received` | Inbound importado en agent-cycle |
| `inference.executed` | Gemini clasifica la conversacion |
| `message.sent` | Outbox aprobado y enviado via Composio |
| `needs_human` | Lead escalado a human review |
| `lead.qualified` | `extracted_info` tiene `telefono` o `email` |

## Notification service (portátil + Cloudflare Tunnel)

Stack: Node.js + Express + wacli. Corre en el portátil de la oficina.

```
POST /notify  { to: jid, message }  → envía WhatsApp al grupo via wacli
GET  /chats   ?q=nombre             → lista grupos para obtener JIDs
GET  /health                        → healthcheck
```

Auth: `Authorization: Bearer NOTIFY_SECRET`

> OJO: el campo es `to`, no `jid`. El endpoint es `/notify`, no `/send`.

## Configuracion IberoExpress (ejemplo inicial)

| Regla | Evento | Condicion | Destino | Template |
|-------|--------|-----------|---------|----------|
| Logs Admin | `message.received`, `inference.executed`, `message.sent` | — | Grupo personal (yo) | Log tecnico |
| RRSS Needs Human | `needs_human` | — | Grupo RRSS (2 chicas) | Alerta escalacion |
| Comerciales Lead | `lead.qualified` | — | Grupo Comerciales Ibero | Ficha lead con datos |

## Pasos

### Fase 1 — Servidor puente local ✅ COMPLETADO
- [x] wacli instalado y autenticado con QR de IberoExpress
- [x] Servidor Node.js (Express + execFile) corriendo en puerto 3000
- [x] Endpoint `POST /send` con auth Bearer `secreto_iberoexpress_2026`
- [x] Cloudflare Tunnel activo — URL: `https://jackets-disclaimer-how-sessions.trycloudflare.com`
- [x] Prueba end-to-end OK: curl desde internet → portátil → wacli → grupo WhatsApp real
- [x] JID grupo pruebas: `34691194200-1539273431@g.us`

### Fase 2 — Modelo de datos en FlowLab ✅ COMPLETADO
- [x] Migracion: tablas `alert_destinations`, `alert_rules`, `alert_logs`
- [x] API admin: `GET/POST/DELETE /api/admin/alert-destinations`
- [x] API admin: `GET/POST/DELETE /api/admin/alert-rules`

### Fase 3 — Dispatcher en FlowLab ✅ COMPLETADO
- [x] `src/lib/alert-dispatcher.ts` — renderizar template con payload, evaluar conditions
- [x] Hooks en `agent-cycle.ts` — emit eventos en cada paso del ciclo
- [x] `alert_logs` — registrar cada intento (success/error)
- [x] Corregir bug: endpoint `/send` → `/notify`, campo `jid` → `to` (alertas fallaban silenciosamente)
- [x] `lead.qualified` guardado detrás de `!needs_human` (fix paridad)
- [x] Campo `category` añadido al payload de `needs_human` (necesario para condiciones de routing)

### Fase 4 — Deploy y configuracion ✅ COMPLETADO
- [x] Servidor local en portátil + Cloudflare Tunnel (en lugar de Fly.io)
- [x] Env vars en Vercel: `NOTIFY_SERVICE_URL`, `NOTIFY_SECRET`
- [x] Seed IberoExpress: 4 destinos + 6 reglas en prod
- [x] Prueba end-to-end: alertas llegando a grupos WhatsApp reales

### Fase 5 — UI de alertas ✅ COMPLETADO (2026-03-22)
- [x] Nueva pestaña **Alerts** (4ª pestaña) en la vista de flow
- [x] Toggle ON/OFF alertas en simulación (persiste en localStorage por flow)
- [x] Endpoint `GET /api/flows/[flowId]/alerts` (rules + destinations + logs por tenant)
- [x] Inference endpoint acepta flag `fire_alerts` (default true, false desde UI cuando toggle OFF)

### Siguiente — Validación en simulación
- [x] **Actualizar server.js del portátil** — `POST /send { jid }` → `POST /notify { to }`. Contrato alineado con el dispatcher.
- [ ] Simular B2B completa con alertas ON y verificar que llegan a los grupos correctos
- [ ] Simular B2C, proveedor, fuera_de_contexto
- [ ] Ver [paso 4 en ibero-leads-organicos-deploy.md](ibero-leads-organicos-deploy.md)

## Formatos de mensaje (plantillas iniciales)

### lead.qualified → Comerciales Ibero
```
🟢 *Nuevo lead cualificado — {{flow_name}}*

👤 {{nombre_contacto}} ({{nombre_negocio}})
📍 {{ubicacion}}
📱 {{telefono}}
📧 {{email}}
🏢 Tipo: {{tipo_negocio}}
🛒 Interés: {{productos_interes}}

💡 Categoría: {{category_name}}
─────────────────
🤖 FlowLab · {{time}}
```

### needs_human → RRSS
```
🔴 *Necesita atención humana*

👤 {{lead_name}} · {{flow_name}}
💬 Motivo: {{needs_human_reason}}
🔗 Ver lead en FlowLab

─────────────────
🤖 FlowLab · {{time}}
```

### message.received / inference.executed / message.sent → Log personal
```
📨 *{{event_label}}*
👤 {{lead_name}} → {{flow_name}}
💬 {{summary}}
─────────────
🤖 FlowLab · {{time}}
```

## Modelo mental: cómo funciona el servidor local (wacli)

### El servidor: "El músculo tonto"
`server.js` no sabe nada de IberoExpress, leads ni comerciales. Es un mensajero ciego y obediente. Su única mision: escuchar en un puerto esperando dos datos — **a quién** y **el qué**.

Quien decide el routing es **Vercel** (el dispatcher). El servidor local solo ejecuta.

### Contrato de comunicacion

El servidor expone un endpoint `POST /send` que recibe:

```json
{
  "jid": "34691194200-1539273431@g.us",
  "message": "🟢 Lead de Juan en Madrid. Tel: 666555444"
}
```

- **jid** — calculado por Vercel consultando `alert_rules` + `alert_destinations`
- **message** — ya formateado por Vercel (template renderizado con datos reales)

### Como se comunica con WhatsApp (wacli)

El servidor recibe el JSON, extrae `jid` y `message`, y ejecuta via `execFile`:

```bash
wacli send text --to "34691194200-1539273431@g.us" --message "🟢 Lead de Juan..."
```

wacli tiene la sesion de WhatsApp guardada localmente (tras escanear el QR). Encripta el mensaje y lo manda a los servidores de Meta.

### Como Vercel llega al servidor local (Cloudflare Tunnel)

El servidor local se expone a internet mediante **Cloudflare Tunnel** (sin IP publica, sin abrir puertos del router). Vercel llama con un simple fetch:

```typescript
await fetch("https://tu-subdominio.trycloudflare.com/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer secreto_iberoexpress_2026"
  },
  body: JSON.stringify({
    jid: "34691194200-1539273431@g.us",
    message: "🟢 Lead de Juan en Madrid..."
  })
})
```

### Flujo completo

```
FlowLab (Vercel)
  evalua reglas → monta texto → hace fetch
      ↓
Cloudflare Tunnel
  (expone el portatil a internet de forma segura)
      ↓
server.js (Node local, puerto 3000)
  comprueba Authorization → extrae jid + message → execFile
      ↓
wacli (CLI local, sesion WA activa)
  encripta y manda a Meta
      ↓
WhatsApp → grupo destino
```

### Opciones de hosting del servidor

| Opcion | Pros | Contras |
|--------|------|---------|
| **Portatil + Cloudflare Tunnel** | Gratis, sesion WA facil de gestionar | Requiere portatil encendido |
| **Fly.io + volumen persistente** | 24/7, autonomo | Mas complejo gestionar sesion WA |
| **VPS propio** | Control total | Coste |

**Decision inicial**: portatil + Cloudflare Tunnel para arrancar rapido. Migrar a Fly.io cuando el flujo este probado.

## Notas de diseño
- El notification service es stateless respecto a las reglas — solo sabe mandar WhatsApp
- Las reglas y el routing viven en FlowLab (Vercel), no en el servicio externo
- `conditions` es simple (un campo, un operador, un valor) — no hay AND/OR de momento
- Para anadir Slack o webhook: solo nuevo `provider` en alert_destinations, nuevo handler en dispatcher
- La sesion whatsapp-web.js persiste en volumen Fly.io (equivalente al volume de Railway)
