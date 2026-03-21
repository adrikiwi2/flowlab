---
title: Primer despliegue — Leads Orgánicos IberoExpress en Instagram real
status: in_progress
priority: high
tags: [iberoexpress, deploy, instagram, agent_config]
---

## Objetivo

Conectar el flow "Leads Orgánicos" de IberoExpress a la cuenta real de Instagram, validar que la lógica funciona con conversaciones reales, y activar el alert engine. Antes de conectar: redesign del flow aprobado por la directora de ventas + validación en simulación.

## Camino completo (en orden)

1. [x] **Proponer y confirmar** rediseño del flow
2. [x] **Aplicar cambios** en prod (Turso): categorías, templates, extract fields
3. [ ] **Definir e implementar stages** (agent_config) — BLOQUEANTE para alertas
4. [ ] **Validar en simulación** con stages activos y alertas correctas
5. [ ] **Conectar Composio** (Instagram IberoExpress)
6. [ ] **Primer Scan Inbox** con alert engine activo → verificar alertas en WhatsApp
7. [ ] **Go / No-Go** definitivo

> **Decisión de arquitectura:** las alertas dependen de stages, no de categorías.
> Comerciales recibe alerta cuando el lead avanza al stage `datos_recibidos`.
> Esto aplica tanto a stages automáticos (por categoría detectada) como a stages
> sugeridos por el LLM via `suggested_stage` (ya implementado en InferenceResult).

---

## Rediseño del flow (pendiente de confirmación)

### Decisión de negocio
La directora de ventas simplifica el flujo: eliminar knowledge base (catálogo). Si preguntan por producto + es B2B → recoger datos → "Un comercial te contactará en 3 días".

### Categorías propuestas (9) — confirmadas

| Categoría | Mode | Acción |
|-----------|------|--------|
| `consulta_producto_b2b` | template | Lead B2B confirmado → pedir datos de contacto |
| `datos_recibidos` | template | Lead ya envió sus datos → confirmar y cerrar |
| `sin_cualificar` | template | No sabemos si es B2B → preguntar |
| `b2c_detectado` | — | needs_human → alerta RRSS |
| `ya_soy_cliente` | — | needs_human → alerta RRSS |
| `proveedor_colaboracion` | — | needs_human → alerta RRSS |
| `queja_incidencia` | — | needs_human → alerta RRSS |
| `pregunta_general` | template | Responder + cualificar |
| `fuera_de_contexto` | template | Redirigir amablemente |

**Todos los needs_human** → alert_rule ya configurada: evento `needs_human` → grupo RRSS Alertas Instagram (`120363406018911277@g.us`). El mensaje incluye `{{needs_human_reason}}` con la categoría detectada, así las chicas saben el contexto.

### Templates propuestos

**consulta_producto_b2b:**
```
¡Genial! Para que nuestro equipo comercial te contacte en un máximo de 3 días hábiles, necesito estos datos:
- Nombre del negocio
- Persona de contacto
- Teléfono
- Email
- Localización
- Productos de interés

¿Me los confirmas?
```

**datos_recibidos:**
```
¡Perfecto! Hemos registrado tu solicitud. Nuestro equipo comercial se pondrá en contacto en un máximo de 3 días hábiles. 🙌
```

**sin_cualificar:**
```
¡Hola! IberoExpress es distribución mayorista de alimentación. ¿Tu consulta es para un negocio (hostelería, restaurante, tienda...)?
```

**b2c_detectado:** → needs_human=true, sin respuesta automática

**pregunta_general:**
```
¡Hola! Soy el asistente de IberoExpress, especializado en distribución mayorista. Si tienes alguna consulta sobre nuestros productos, estaré encantado de ayudarte. ¿Es para un negocio?
```

**fuera_de_contexto:**
```
Hola, soy el asistente de IberoExpress — solo puedo ayudar con consultas sobre distribución mayorista de alimentación. Si tienes alguna duda relacionada, escríbenos. 😊
```

### Extract fields (7 — se mantienen todos los actuales)

Confirmado consultando Turso directamente. `tipo_negocio` captura el enriquecimiento necesario (distribuidor, restaurante, tienda, online...) — no se elimina.

| Field | Tipo | Descripción |
|-------|------|-------------|
| nombre_negocio | text | Nombre del negocio o empresa |
| nombre_contacto | text | Nombre de la persona de contacto |
| telefono | text | Teléfono de contacto |
| email | email | Email de contacto |
| ubicacion | text | Ciudad, provincia o país |
| tipo_negocio | text | Tipo: tienda, restaurante, distribuidor, online, otro |
| productos_interes | text | Categorías o productos mencionados |

### ✅ Decisiones confirmadas
- B2C detectado → needs_human → alerta RRSS (sin respuesta automática)
- Ya soy cliente → needs_human → alerta RRSS
- Proveedor / colaboración → needs_human → alerta RRSS
- Queja / incidencia → needs_human → alerta RRSS
- Todos los needs_human van al grupo RRSS Alertas Instagram (JID ya configurado en alert_rules)

---

## Stages del funnel (agent_config) — CAPA SEPARADA

Las categorías clasifican cada mensaje individual. Los stages rastrean dónde está el lead en el funnel global. Son independientes.

### Stages propuestos

```
nuevo → sin_cualificar → cualificado_b2b → datos_solicitados → datos_recibidos → needs_human
```

| Stage | Cuándo |
|-------|--------|
| `nuevo` | Lead acaba de aparecer |
| `sin_cualificar` | Le hemos preguntado si es B2B, esperando respuesta |
| `cualificado_b2b` | Confirmado B2B, aún no hemos pedido datos |
| `datos_solicitados` | Hemos pedido los datos, esperando que los envíe |
| `datos_recibidos` | Tiene todos los datos, esperando comercial |
| `needs_human` | B2C detectado o caso complejo |

### Flags propuestos

| Flag | Qué trackea |
|------|-------------|
| `is_b2b` | Lead confirmó ser negocio |
| `datos_solicitados` | Ya le pedimos los datos (evita re-preguntar) |
| `datos_completos` | Tenemos telefono + email como mínimo |

### Policy rules propuestas

```json
[
  {
    "when": { "detected_status": "b2c_detectado" },
    "then": { "escalate": true, "advance_to": "needs_human" }
  },
  {
    "when": { "detected_status": "consulta_producto_b2b", "datos_solicitados": false },
    "then": { "advance_to": "datos_solicitados", "set_flag": "datos_solicitados" }
  },
  {
    "when": { "detected_status": "datos_recibidos" },
    "then": { "advance_to": "datos_recibidos", "set_flag": "datos_completos" }
  }
]
```

### agent_config completo propuesto

```json
{
  "channel": "instagram",
  "mode": "inbound",
  "stages": ["nuevo", "sin_cualificar", "cualificado_b2b", "datos_solicitados", "datos_recibidos", "needs_human"],
  "initial_stage": "nuevo",
  "flags": ["is_b2b", "datos_solicitados", "datos_completos"],
  "policy_rules": [
    {
      "when": { "detected_status": "b2c_detectado" },
      "then": { "escalate": true, "advance_to": "needs_human" }
    },
    {
      "when": { "detected_status": "consulta_producto_b2b", "datos_solicitados": false },
      "then": { "advance_to": "datos_solicitados", "set_flag": "datos_solicitados" }
    },
    {
      "when": { "detected_status": "datos_recibidos" },
      "then": { "advance_to": "datos_recibidos", "set_flag": "datos_completos" }
    }
  ],
  "max_interactions": 6,
  "confidence_threshold": 0.7
}
```

> **max_interactions = 6**: margen para: saludo → cualificación B2B → petición datos → datos enviados → confirmación → seguimiento. A partir de ahí → needs_human.

---

## Lo que cambia vs estado actual en Turso

### Se elimina
- [ ] 2 knowledge docs (catálogo congelados + recetas)
- [ ] Categoría "Consulta de producto" (knowledge) → reemplazada por `consulta_producto_b2b` + `sin_cualificar`
- [ ] Categoría "Recetas / uso" (knowledge)
- [ ] Categoría "HORECA" → absorbida por `consulta_producto_b2b`
- [ ] Categorías con nombres poco precisos: "Info general", "Precios / condiciones" → renombradas

### Se mantiene
- Los 7 extract fields actuales (incluyendo `tipo_negocio`)

### Se renombra / reestructura (11 cats → 6 cats)
| Antes | Después |
|-------|---------|
| Interés en distribuir | `consulta_producto_b2b` |
| Consumidor final | `b2c_detectado` → needs_human |
| (knowledge) Consulta de producto + HORECA | `sin_cualificar` (nueva) |
| Info general + Precios/condiciones | `pregunta_general` |
| Spam / irrelevante | `fuera_de_contexto` |
| (nueva) | `datos_recibidos` |
| Ya soy cliente, Proveedor, Queja | → `needs_human` o absorbed en `pregunta_general` |

---

## Checklist de aplicación

### Paso 2 — Aplicar en prod ✅ COMPLETADO
- [x] Confirmar diseño con directora de ventas
- [x] Borrar 2 knowledge docs (catálogo + recetas)
- [x] Borrar 4 categorías obsoletas (precios, consulta_producto knowledge, horeca, recetas knowledge)
- [x] Renombrar 4 categorías existentes + actualizar rules
- [x] Crear 2 categorías nuevas (Sin cualificar, Datos recibidos)
- [x] Crear 5 templates nuevos
- [x] 7 extract fields confirmados y mantenidos (incluyendo tipo_negocio)
- Script ejecutado: `scripts/redesign-leads-organicos.mjs` → Turso prod OK

### Paso 3 — Implementar stages + alert routing ✅ COMPLETADO
- [x] Setear agent_config en flow `xZJX2B7hDOELmLBhnDyrp` (6 stages, 3 flags, 3 policy_rules, max_interactions=6)
- [x] Verificar que `agent_config_panel.tsx` muestra stages correctamente en UI
- [x] Añadir alert_rule: `needs_human` → Logs Admin
- [x] Corregir lógica `lead.qualified`: condición `category_name == "Datos recibidos"` en DB + `!needs_human` en código
- [x] Añadir campo `category` al dispatch de `needs_human` en `agent-cycle.ts` (necesario para condiciones)
- [x] Crear destination + rule para grupo **Proveedores Partners** (`120363405231606345@g.us`)
  - Condición: `category == "Proveedor / colaboración"` — solo fires cuando es proveedor/partner

> **Alert routing final (6 reglas en DB):**
> | Evento | Destino | Condición |
> |--------|---------|-----------|
> | `inference.executed` | Logs Admin | — |
> | `message.sent` | Logs Admin | — |
> | `needs_human` | Logs Admin | — |
> | `needs_human` | RRSS Alertas Instagram | — |
> | `needs_human` | Proveedores Partners | `category == "Proveedor / colaboración"` |
> | `lead.qualified` | Comerciales Ibero | `category_name == "Datos recibidos"` |

> **Pendiente (post-simulación):** actualizar la rule de "Datos recibidos" en categorías para exigir
> confirmación B2B previa — actualmente un consumidor que envía datos podría activar la categoría.

### Paso 4 — Validar en simulación ← SIGUIENTE
- [ ] Simular B2B completa: saludo → sin_cualificar → datos_solicitados → datos_recibidos
  → Esperado: Logs Admin en cada paso, Comerciales solo en datos_recibidos
- [ ] Simular B2C: needs_human → RRSS + Logs Admin (NO Comerciales, NO Proveedores)
- [ ] Simular proveedor/partner: needs_human → RRSS + Logs Admin + **Proveedores Partners**
- [ ] Simular sin_cualificar y fuera_de_contexto: solo Logs Admin
- [ ] Verificar que extracted_info recoge los 7 fields correctamente
- [ ] Actualizar regla categoría "Datos recibidos" para exigir confirmación B2B

### Paso 5 — Conectar Instagram
- [ ] Composio connection ibero@test.com en prod (OAuth self-service desde Live tab)
- [ ] Verificar que el flow tiene agent_config + composio_connection antes de publicar

### Paso 6 — Primer Scan
- [ ] Portátil encendido + Cloudflare Tunnel activo
- [ ] NOTIFY_SERVICE_URL en Vercel apunta a URL correcta del túnel
- [ ] Scan Inbox manual → verificar alertas en grupos WhatsApp
- [ ] Revisar outbox: templates propuestos correctos
- [ ] Revisar leads: stages asignados correctamente

### Paso 7 — Go / No-Go
- [ ] Al menos 3 conversaciones procesadas correctamente en prod
- [ ] Alert engine disparando (mensajes llegando a WhatsApp)
- [ ] No se ha enviado ningún mensaje automáticamente sin aprobación humana
