---
id: set-agent-config
title: Configurar agent_config en un flow
status: reference
priority: high
created: 2026-03-08
---

## Descripcion

`agent_config` es una columna JSON en la tabla `flows` que define como el agente local debe comportarse al procesar conversaciones reales. Es **admin-only** — los tenants lo ven en UI (read-only) pero no pueden modificarlo.

## Estructura del JSON

```json
{
  "channel": "instagram",
  "mode": "outreach",
  "stages": ["outreach_sent", "replied", "engaged", "converted", "needs_human"],
  "initial_stage": "outreach_sent",
  "flags": ["cta_sent", "booking_link_sent"],
  "policy_rules": [
    {
      "when": { "detected_status": "interesado", "cta_sent": false },
      "then": { "template": "cta_template", "set_flag": "cta_sent", "advance_to": "engaged" }
    },
    {
      "when": { "detected_status": "interesado", "cta_sent": true, "interaction_count_gte": 3 },
      "then": { "escalate": true, "advance_to": "needs_human" }
    }
  ],
  "max_interactions": 4,
  "confidence_threshold": 0.7
}
```

### Campos

| Campo | Tipo | Descripcion |
|---|---|---|
| `channel` | string | Canal: `instagram`, `whatsapp`, `tiktok`, `linkedin` |
| `mode` | string | Modo: `outreach` (bot inicia) o `inbound` (lead inicia) |
| `stages` | string[] | Pipeline de estados del lead, en orden. Incluir siempre `needs_human` como ultimo |
| `initial_stage` | string | Estado inicial al crear un lead |
| `flags` | string[] | Flags booleanos que el agente trackea por lead (ej: `cta_sent`) |
| `policy_rules` | object[] | Reglas deterministas: `when` (condiciones) → `then` (acciones) |
| `max_interactions` | number | Maximo de interacciones antes de escalar a humano |
| `confidence_threshold` | number | Umbral de confianza del LLM; por debajo → `needs_human` |

### Policy rules — `when` (condiciones)

- `detected_status`: valor de la categoria clasificada por el LLM
- Cualquier flag definido en `flags`: `true` o `false`
- `interaction_count_gte`: numero minimo de interacciones

### Policy rules — `then` (acciones)

- `template`: id o nombre del template a enviar
- `set_flag`: flag a marcar como true
- `advance_to`: nuevo stage del lead
- `escalate`: `true` para marcar como needs_human

## Como setearlo

### Via Bearer token (recomendado para prod)

```bash
# 1. Obtener token
TOKEN=$(curl -s -X POST https://flowlab-eta.vercel.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"TENANT_EMAIL","password":"TENANT_PWD"}' | jq -r .token)

# 2. Obtener flow_id
curl -s https://flowlab-eta.vercel.app/api/flows \
  -H "Authorization: Bearer $TOKEN" | jq '.[].id'

# 3. Setear agent_config (el JSON va como string escapado dentro del JSON del body)
curl -s -X PUT https://flowlab-eta.vercel.app/api/flows/FLOW_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent_config": "{\"channel\":\"instagram\",\"mode\":\"outreach\",\"stages\":[...],\"initial_stage\":\"outreach_sent\",\"flags\":[...],\"policy_rules\":[...],\"max_interactions\":4,\"confidence_threshold\":0.7}"}'
```

### Via script local (dev)

```bash
cd D:/pps/flowlab
node -e "
const { createClient } = require('@libsql/client');
const c = createClient({url:'file:flowlab.db'});
const config = JSON.stringify({ /* ... config object ... */ });
c.execute({ sql: 'UPDATE flows SET agent_config = ? WHERE id = ?', args: [config, 'FLOW_ID'] })
  .then(r => console.log('Updated:', r.rowsAffected));
"
```

### Para quitar el agent_config

```bash
curl -s -X PUT https://flowlab-eta.vercel.app/api/flows/FLOW_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent_config": null}'
```

## Donde se ve en UI

Flow page → boton **Config** → panel **Agent Configuration** (read-only). Solo aparece si `agent_config` no es null. Muestra: stages como pipeline visual, flags, policy rules y parametros del canal.

## Notas

- `agent_config = null` → el flow es solo simulacion (sin agente)
- `agent_config` seteado → el flow es ejecutable por el agente local
- Las categories del flow definen los valores validos de `detected_status` en las policy rules
- Los templates referenciados en `policy_rules.then.template` deben existir en el flow
