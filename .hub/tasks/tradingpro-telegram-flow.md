# Flow "Leads Telegram" — Tradingpro

**Prioridad:** URGENTE
**Tenant:** Tradingpro (`xQBjnyhFY1oPtmFtDn7U5`)
**Fecha creación:** 2026-03-12
**Último avance:** 2026-03-19
**Estado:** ✅ Flow creado en prod — pendiente de variables del cliente para demo

## Contexto

Tradingpro quiere un nuevo flow para leads que entran via Telegram tras ver publicidad en Instagram/Facebook. El ad es genérico sobre TradingPro (no menciona un producto concreto). Al entrar en el canal de Telegram, el bot envía un mensaje de bienvenida tipo "¿En qué puedo ayudarte?".

El primer gancho comercial son **3 meses gratuitos del canal privado de pago** (TradingRoom diaria con Álvaro y José, portfolio compartido).

## Info recopilada

Ver detalle completo de productos, precios y contexto en → [tradingpro-flow-context.md](./tradingpro-flow-context.md)

### Decisiones de diseño (2026-03-19)
1. **Ad genérico** — no menciona producto concreto
2. **Objetivo de conversión** — ofrecer 3 meses gratis del canal privado + derivar a llamada comercial (link calendario de Jorge)
3. **Tono** — tuteo informal
4. **Escalación** — needs_human si la conversación no encaja en ninguna categoría. Objetivo principal: pasar `{{link_calendario}}` para que el comercial cierre
5. **Templates vs Knowledge** — híbrido: knowledge para preguntas de producto, templates para momentos clave del funnel
6. **Orden oferta** — gancho 3 meses gratis siempre primero si el lead es frío; adaptar si ya pregunta algo concreto

### Pendiente de cliente (bloquea demo)
- **`{{link_3_meses_gratis}}`** — link de registro para los 3 meses gratis del canal privado
- **`{{link_calendario}}`** — link de Calendly o similar para reservar llamada con Jorge

### Flow creado en prod (2026-03-19)
- **Flow ID:** `byT0nXrgAS3Vv-soqs63A`
- **Script:** `scripts/create-tradingpro-telegram-flow.js`
- **5 categorías:** Interés general, Pregunta sobre productos (knowledge), Hot lead, Quiere invertir, No interesado
- **6 templates:** Bienvenida, Gancho 3 meses, Reservar llamada, Darwinex, Llamada inversores, Cierre cordial
- **4 extract fields:** nombre, intencion, experiencia, producto_interes
- **Knowledge doc:** info completa de productos/precios para respuestas libres en categoría "Pregunta sobre productos"

## Productos TradingPro (para diseñar categories)

| Producto | Precio | URL |
|---|---|---|
| Más que Mercados (curso gratuito) | Gratis (registro) | tradingpro.app/formacion/mas-que-mercados |
| Curso Inversión y Trading | 1.590€ (oferta, PVP 2.070€) | tradingpro.app/formacion/cursos/inversion-y-trading |
| Programa Mentoría Inversión | 1.590€ (oferta, PVP 2.070€) | tradingpro.app/formacion/cursos/programa-mentoria-inversion |
| Miniclases gratis (videos) | Gratis | tradingpro.app/formacion/videos |
| Membresía PROINVESTOR | 100€/mes · 540€/sem · 960€/año | tradingpro.app/membresia-trading-tradingpro |
| **3 meses canal privado gratis** | Gratis (gancho) | ❓ link pendiente |

## Pasos para crear el flow

- [x] Resolver preguntas de diseño
- [x] Diseñar categorías + rules
- [x] Crear templates con variables
- [x] Definir extract fields
- [x] Knowledge doc de productos
- [x] Crear flow en Turso prod
- [ ] Cliente provee `{{link_3_meses_gratis}}` y `{{link_calendario}}`
- [ ] Sustituir variables en templates y hacer demo
- [ ] (Futuro) Configurar agent_config + conexión canal Telegram

## Acceso directo a Turso prod

```bash
# Leer
node -e "
const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://flowlab-adrikiwi2.aws-eu-west-1.turso.io',
  authToken: '<TOKEN>'
});
db.execute('SELECT ...').then(r => console.log(r.rows));
"
```

Token: se obtiene con `turso db tokens create flowlab` (expira, regenerar si falla).

## Notas
- Tradingpro ya tiene un flow existente "Outreach Inversiones" (outbound frío, no publicado). Este nuevo flow es diferente: inbound templado via ads
- El tenant ya existe en prod con credenciales `tradingpro@test.com`
- FlowLab aún no soporta Telegram como canal (solo Instagram via Composio). Habría que evaluar si Composio soporta Telegram o buscar alternativa
