---
title: Notificaciones WhatsApp a comerciales — IberoExpress
status: in_progress
priority: high
tags: [iberoexpress, whatsapp, railway, notification-service]
---

## Objetivo

Alertar al grupo de WhatsApp de comerciales de IberoExpress cuando un lead del flow "Leads Organicos" proporcione datos de contacto (telefono o email extraidos por Gemini).

## Arquitectura

```
FlowLab (Vercel) → POST /notify → notification-service (Railway) → wacli → grupo WhatsApp
```

## Componentes

### notification-service (Railway)
- Directorio: `notification-service/`
- Stack: Node.js + Express + wacli CLI
- Volume Railway montado en `/root/.wacli` (sesion persistente)
- Env vars Railway:
  - `NOTIFY_SECRET` — token de autorizacion
  - `WHATSAPP_GROUP_JID` — JID del grupo (formato `id@g.us`)
  - `WACLI_STORE=/root/.wacli`

### Trigger en FlowLab (pendiente)
- Fichero: `src/lib/agent-cycle.ts`
- Condicion: `extracted_info.telefono || extracted_info.email` tras inferencia
- Env vars Vercel a anadir:
  - `WHATSAPP_NOTIFY_URL` — URL del servicio en Railway
  - `NOTIFY_SECRET` — mismo token

## Pasos

- [x] Crear `notification-service/` con Express + wacli + Dockerfile + railway.toml
- [x] Deploy en Railway — build OK, healthcheck OK
- [x] Volume montado en Railway (`/root/.wacli`)
- [x] Env vars configuradas en Railway (`NOTIFY_SECRET`, `WACLI_STORE`)
- [ ] **🔴 SIGUIENTE: probar en local primero** — el QR no aparece en los logs de Railway. Arrancar el servicio en local con `npm run dev`, hacer `wacli auth` manualmente para verificar que funciona, luego depurar el endpoint `/auth` para que el QR salga por stdout en Railway
- [ ] Obtener JID del grupo de pruebas: `GET /chats?q=nombre`
- [ ] Anadir `WHATSAPP_GROUP_JID` en Railway
- [ ] Probar `POST /notify` manualmente con grupo de 2 moviles
- [ ] Integrar trigger en `agent-cycle.ts`
- [ ] Anadir `WHATSAPP_NOTIFY_URL` y `NOTIFY_SECRET` en Vercel
- [ ] Probar end-to-end: lead con telefono → alerta en grupo

## Formato del mensaje de alerta (propuesta)

```
🔔 Nuevo lead con datos de contacto — IberoExpress

Nombre: {{nombre_contacto}}
Empresa: {{nombre_negocio}}
Telefono: {{telefono}}
Email: {{email}}
Ubicacion: {{ubicacion}}
Tipo negocio: {{tipo_negocio}}
Productos: {{productos_interes}}
```

## Notas
- El numero de WhatsApp autenticado en wacli deberia ser el corporativo de IberoExpress (o uno dedicado)
- Para el grupo de pruebas: crear grupo con 2 moviles, obtener JID con GET /chats
- La sesion wacli sobrevive reinicios gracias al Volume de Railway
