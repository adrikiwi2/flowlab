# Estado del proyecto — 2026-03-08

## Situacion actual
- MVP local **completo**: auth, flow designer, simulacion con inferencia Gemini
- DB migrada a Turso: `libsql://flowlab-adrikiwi2.aws-eu-west-1.turso.io`
- **Desplegado en produccion**: https://flowlab-eta.vercel.app
- Repo conectado a Vercel con auto-deploy en cada push a master
- Repo remoto: https://github.com/adrikiwi2/flowlab.git

## Novedades (2026-03-08)
- **`needs_human` flag**: el LLM evalua en cada inferencia si la conversacion necesita intervencion humana, independiente de la clasificacion por categoria. Banner amber en UI de simulacion.
- **Bearer token auth**: nuevo endpoint `POST /api/auth/token` que devuelve JWT como JSON. Middleware acepta cookie o `Authorization: Bearer`. Permite clientes externos (agente local).
- **`agent_config`**: columna JSON en flows (admin-only, nullable). Define stages, flags y policy rules para el agente de automatizacion. Panel read-only visible en UI bajo Config.
- **Schema extendido para agente**: 5 tablas nuevas (leads, messages, conversation_state, outbox, lead_events) + indices. Preparado para el agente local que procesara conversaciones reales via scraping.

## Pendiente
1. Crear repo del agente local (Propuesta B: FastAPI + PyInstaller + UI web localhost)
2. Generalizar workflows de scraping IG/WA desde Makuto/funnel-workflows
3. Conectar agente local con FlowLab API (Bearer token + flows + agent_config)
4. Dashboard de conversaciones reales en FlowLab web (leads, mensajes, needs_human queue)

## Tenants en produccion
| Tenant | Email | Flow | Contexto | agent_config |
|---|---|---|---|---|
| Test | test@test.com | — | Tenant de pruebas | — |
| IberoExpress | ibero@test.com | Leads Organicos (inbound) | Distribucion de alimentos, 8 cats, 13 tpls, 10 fields | — |
| Tradingpro | tradingpro@test.com | Outreach Inversiones | Asesoria bursatil outreach, 7 cats, 7 tpls, 8 fields | — |
| Analog | lucia.analog@test.com | Outreach Booking Artistas | Agencia musical, outreach a promotores, 4 cats, 5 tpls, 6 fields | — |
| DistroNow | distronow@test.com | Outreach Artistas IG | Management/A&R via Instagram, 9 cats, 9 tpls, 7 fields | IG outreach, 5 stages |

## Datos en la DB (produccion)
| Tabla | Registros |
|---|---|
| tenants | 5 |
| flows | 4 |
| categories | 28 |
| templates | 34 |
| extract_fields | 31 |
| simulations | 3 |
| leads | 0 (nueva) |
| messages | 0 (nueva) |
| conversation_state | 0 (nueva) |
| outbox | 0 (nueva) |
| lead_events | 0 (nueva) |

## Infraestructura
| Entorno | DB | Config |
|---|---|---|
| Local | `file:flowlab.db` | `.env.local` |
| Produccion | `libsql://flowlab-adrikiwi2.aws-eu-west-1.turso.io` | Vercel env vars |
