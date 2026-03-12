# Flow: Agente Comercial (pedidos) — IberoExpress

**Estado:** Creado en prod, listo para demo desde Simulate
**Flow ID:** `OxaT4xkjPJKf-wGqXf_d-`
**Tenant:** IberoExpress (`ibero@test.com`, `MaGjPJ6t-A47urN-yvWFt`)
**Fecha:** 2026-03-12

## Objetivo

Asistente IA para comerciales de IberoExpress: recibe pedidos de clientes B2B por WhatsApp/email, extrae productos y cantidades, consulta catalogo y historial, genera propuesta de pedido estructurada para aprobacion humana.

## Estado actual

- Flow creado con datos mock (SAP no integrado aun)
- Knowledge docs simulan datos SAP: catalogo (30 productos) + clientes (8 empresas con historial)
- System prompt optimizado: el agente sabe que el cliente ya esta identificado, escribe como el comercial humano
- `suggested_stage` activo en inferencia (badge violeta en UI)

## Estructura del flow

- **9 categorias**: Pedido nuevo (knowledge), Consulta de stock (knowledge), Consulta de precio (knowledge), Repetir pedido anterior (knowledge), Modificacion de pedido (template), Estado de pedido (template), Reclamacion/incidencia (template), Consulta general (template), Audio recibido (template)
- **9 templates**: 2 modificacion, 2 estado, 2 reclamacion, 2 consulta general, 1 audio
- **6 extract fields**: nombre_cliente, codigo_cliente_sap, productos_pedido, urgencia, canal_origen, comercial_asignado
- **2 knowledge docs** (mock SAP):
  - Catalogo: 12 congelados + 18 secos/conservas con codigo SAP, marca, precio/caja, uds/caja, stock
  - Clientes: 8 empresas (C001-C008) con contacto, zona, comercial, tipo, pedido medio, frecuencia, ultimos 2-3 pedidos

## Flujo real (futuro con SAP)

```
1. Recepcion del pedido (WhatsApp/email)
2. Transcripcion (audio → texto, futuro con Whisper)
3. Extraccion: cliente, productos, cantidades
4. Consulta SAP Service Layer (GET /Items, GET /BusinessPartners, GET /Orders)
5. Validacion automatica (stock, coherencia historial)
6. Generacion propuesta de pedido
7. Revision del comercial (human-in-the-loop via outbox)
8. Creacion pedido en SAP (POST /Orders)
9. Documentacion (albaran + factura)
```

Hoy se simulan pasos 3-7. Pasos 1-2 y 8-9 pendientes de integracion.

## Decisiones de diseno

- **Un flow por objetivo**: Leads Organicos (captar datos) y Agente Comercial (procesar pedidos) son flows separados — audiencia, objetivo y tono distintos
- **Cliente ya identificado**: cada conversacion esta vinculada a un cliente conocido. El agente no pregunta quien es ni si es B2B
- **Tono de comercial humano**: sin explicar pasos internos ("he revisado los datos"), sin redundancias ("este volumen es coherente")
- **Knowledge docs como mock de SAP**: cuando la integracion real este lista, los docs se reemplazaran por llamadas al Service Layer API

## Dependencias para produccion

- [ ] Reunion tecnica con partner SAP (acceso Service Layer)
- [ ] Integracion SAP Service Layer (GET Items, BusinessPartners, Orders)
- [ ] Integracion WhatsApp Business API (canal de entrada)
- [ ] Transcripcion de audio (Whisper)
- [ ] Stages en flow designer (recepcion → extraccion → validacion → propuesta → aprobado)

## Contexto del proyecto IberoExpress

Ver `D:\pps\ibexpress\agente-comercial\.hub\` para vision completa, roadmap (7 hitos), y tareas del proyecto de integracion SAP.
