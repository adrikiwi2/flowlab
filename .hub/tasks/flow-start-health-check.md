---
title: Flow Start Health Check — Reporte de arranque al conectar flow
status: todo
priority: high
tags: [alert-engine, logs, iberoexpress, ux]
---

## Objetivo

Cuando un flow se publica y se ejecuta el primer scan de inbox, enviar un reporte de diagnóstico al grupo de Logs Admin antes de procesar ninguna conversación. Esto permite al operador ver el estado real de la cuenta y decidir si la lógica del flow encaja con las conversaciones existentes.

## Trigger

Primera ejecución de `processFlow()` para un flow (detectado porque no hay leads en DB aún, o porque un flag `first_scan` está activo).

## Contenido del mensaje (Logs Admin)

```
🚀 *FLOW ACTIVADO — {{flow_name}}*
📡 Canal: Instagram · {{account_handle}}

📊 Estado del inbox:
• Conversaciones activas: {{conv_count}}
• Mensajes sin leer (inbound): {{unread_count}}
• Más antiguo sin leer: {{oldest_unread_age}}
• Conversaciones con actividad reciente (<24h): {{recent_count}}

⚠️ Alertas de colisión:
{{collision_alerts}}

🛠️ Modo: SILENCIOSO — el flow leerá e inferirá pero no encolará respuestas en este primer scan.
─────────────────
🤖 FlowLab · {{time}}
```

## Los 4 escenarios de colisión (decisiones de diseño)

### 1. "Necromancia" — Mensajes muy antiguos
**Riesgo**: IA clasifica como lead cualificado un mensaje de hace 3 días, comercial llama y el cliente ya compró en otro sitio.
**Decisión adoptada**: En el health check se muestra la edad del mensaje más antiguo sin leer. El operador decide si continuar. Implementar age_threshold configurable en agent_config (ej. `max_message_age_hours: 48`). Mensajes más viejos → importar sin inferencia.

### 2. "Conversación a medias" — Humano presente reciente
**Riesgo**: IA entra y corta conversación activa que un humano estaba gestionando.
**Decisión adoptada**: Si los últimos mensajes outbound son recientes (<X horas), marcar lead como needs_human automáticamente en el arranque. Incluir conteo en el health check.

### 3. "Bucle de bienvenida" — Primer scan silencioso
**Riesgo**: Al conectar, IA detecta 50 "nuevos leads" y les manda a todos mensaje de bienvenida.
**Decisión adoptada**: El primer scan es SIEMPRE silencioso (lee e infiere pero no encola en outbox). Se activa con flag `is_first_scan` en processFlow(). A partir del segundo scan, comportamiento normal.

### 4. "Capacidad del flow" — Temas fuera de scope
**Riesgo**: IA fuerza venta cuando el cliente pregunta por horarios/quejas.
**Decisión adoptada**: En el health check, incluir un mini-resumen de topics detectados (usando classifyConversation en modo dry-run sobre muestra de mensajes). Opcional: incluir alerta si >X% de conversaciones caen en categorías de baja prioridad.

## Implementación

### Detectar primer scan
```typescript
// En processFlow(), antes de iterar conversaciones:
const existingLeadsCount = await countLeadsByFlow(flowId)
const isFirstScan = existingLeadsCount === 0
```

### Recopilar métricas del inbox
```typescript
const stats = await buildInboxStats(conversations, myPlatformId)
// stats: { conv_count, unread_count, oldest_unread_age, recent_conv_count, collision_warnings[] }
```

### Enviar health check al grupo de logs
```typescript
if (isFirstScan) {
  await dispatch(tenantId, flowId, 'flow.started', {
    flow_name, account_handle,
    conv_count: String(stats.conv_count),
    unread_count: String(stats.unread_count),
    oldest_unread_age: stats.oldest_unread_age,
    recent_count: String(stats.recent_conv_count),
    collision_alerts: stats.collision_warnings.join('\n') || 'Ninguna detectada ✅',
    time,
  })
  // Primer scan: importar mensajes pero NO encolar respuestas
}
```

### Nuevo evento en el catálogo
Añadir `flow.started` al catálogo de eventos del alert engine. El seed de IberoExpress incluirá una regla para este evento en el destino Logs Admin.

## Pasos
- [ ] Añadir `flow.started` al tipo `AlertEventType` en alert-dispatcher.ts
- [ ] Añadir `countLeadsByFlow(flowId)` en db.ts
- [ ] Implementar `buildInboxStats()` en agent-cycle.ts
- [ ] Lógica de primer scan silencioso en `processFlow()`
- [ ] Añadir regla `flow.started` al seed de IberoExpress (`alert-seed/route.ts`)
- [ ] Añadir `max_message_age_hours` como campo opcional en agent_config

## Notas
- El primer scan silencioso NO anula el outbox — si hay outbox items pendientes de scans anteriores, siguen activos.
- El health check se envía solo si hay una regla `flow.started` configurada para ese flow. Si no hay regla, no pasa nada (comportamiento actual).
- El resumen de topics es opcional y costoso (una inferencia por conversación). Para la v1, solo métricas numéricas sin inferencia.
