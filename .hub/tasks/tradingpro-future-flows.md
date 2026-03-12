# TradingPro — Flows futuros (backlog)

**Tenant:** Tradingpro (`xQBjnyhFY1oPtmFtDn7U5`)
**Prioridad:** BAJA (pendiente de que el flow de Telegram Leads esté operativo)

---

## 1. Seguidores Instagram

**Canal:** Instagram DMs
**Tipo:** Outbound
**Descripción:** Contactar a nuevos seguidores del perfil de TradingPro en Instagram. Mensaje de bienvenida automatizado + clasificación de intención + derivación a producto.

**Info pendiente para diseñar demo:** ver [preguntas al cliente](#preguntas-por-flow) abajo.

---

## 2. LinkedIn — Contactos y engagement

**Canal:** LinkedIn
**Tipo:** Outbound / Semi-inbound
**Descripción:** Tres fuentes de leads desde LinkedIn:
- **Contactos directos** de TradingPro: outreach a conexiones existentes
- **Perfiles que dan like a publicaciones**: detectar interés y contactar
- **Personas que ven el perfil de TradingPro**: señal de curiosidad, iniciar conversación

**Dinámica real:** Jorge repostea contenido de TradingPro → alguien da like → TradingPro se pone en contacto con esa persona.

Nota: requiere evaluar qué APIs/herramientas permiten acceder a estos datos (LinkedIn es restrictivo con automatizaciones).

**Info pendiente para diseñar demo:** ver [preguntas al cliente](#preguntas-por-flow) abajo.

---

## 3. WhatsApp — Seguimiento y venta cruzada a clientes

**Canal:** WhatsApp
**Tipo:** Outbound a clientes existentes
**Responsable actual:** Jorge Batres (47 clientes con cuenta en broker)
**Descripción:** Dar seguimiento a clientes actuales para:
- Seguimiento de satisfacción
- Upsell de productos complementarios (ej: alumno de curso gratuito → curso de pago, miembro mensual → anual)
- Cross-sell (ej: alumno de trading → mentoría inversión, Darwinex)
- Renovaciones de membresía

Nota: requiere evaluar integración WhatsApp Business API (Composio u otra herramienta).

**Info pendiente para diseñar demo:** ver [preguntas al cliente](#preguntas-por-flow) abajo.

---

## 4. Prospección para nuevos afiliados

**Canal:** Email / LinkedIn / DMs
**Tipo:** Outbound
**Situación actual:** 4 afiliados hoy (influencers). Ejemplo: un boxeador que sube un link de referido dos veces a la semana. Para cada afiliado se negocia una **comisión específica**.
**Descripción:** Contactar potenciales afiliados (influencers financieros, creadores de contenido, educadores) para que recomienden TradingPro a su audiencia. Incluye:
- Identificación de candidatos
- Outreach con propuesta de afiliación
- Seguimiento y negociación de condiciones
- Darwinex como ejemplo de modelo afiliado exitoso (referidos)

**Info pendiente para diseñar demo:** ver [preguntas al cliente](#preguntas-por-flow) abajo.

---

## Dependencias comunes

- **Telegram Leads** (flow urgente) debe funcionar primero como referencia
- Evaluar soporte de canales en Composio: Instagram DMs (ya funciona), WhatsApp, LinkedIn, Telegram
- Cada flow necesitará su propio diseño de categories, templates, extract fields
- La **cualificación F1/F2** (invertir vs aprender, segmentación por edad) aplica transversalmente a todos los flows — ver [contexto](tradingpro-flow-context.md)

---

## Preguntas por flow

Info a pedir al cliente para diseñar correctamente una demo de cada flow.

### 1. Seguidores Instagram
- [ ] **Mensaje de bienvenida**: ¿qué dice Jorge hoy cuando un seguidor nuevo llega? ¿Hay un mensaje estándar?
- [ ] **Gancho**: ¿se ofrece algo gratis (3 meses Telegram, miniclase, etc.) o es solo saludo?
- [ ] **Volumen**: ¿cuántos seguidores nuevos al día/semana?
- [ ] **Ejemplos de conversaciones reales**: 2-3 chats típicos (buen lead, lead frío, lead que escala a humano)
- [ ] **Criterios de escalación**: ¿cuándo pasa a Jorge manualmente?
- [ ] **Tono**: ¿formal, cercano, tuteo/ustedeo?
- [ ] **Objetivo final**: ¿a qué producto/acción se quiere llevar al lead? (Darwinex, curso, membresía, Telegram gratis)

### 2. LinkedIn
- [ ] **Mensaje tipo por fuente**: ¿qué dice Jorge a un contacto directo vs alguien que dio like vs alguien que vio el perfil?
- [ ] **Ejemplos de mensajes reales** que Jorge envía hoy en LinkedIn
- [ ] **Volumen**: ¿cuántos likes/visitas de perfil al día/semana?
- [ ] **Perfil objetivo**: ¿hay filtro por sector, cargo, edad?
- [ ] **Objetivo final**: ¿derivar a Telegram, a web, a llamada?
- [ ] **Tono**: LinkedIn suele ser más formal — ¿se mantiene o es cercano?
- [ ] **¿Jorge usa su perfil personal o el de TradingPro?**

### 3. WhatsApp a clientes
- [ ] **Lista de productos que tiene cada cliente**: ¿hay un CRM o Excel con qué compró cada uno?
- [ ] **Mensajes de seguimiento tipo**: ¿qué les dice Jorge? ¿Cada cuánto?
- [ ] **Triggers de upsell**: ¿qué evento dispara un contacto? (ej: se acaba la membresía, llevan 3 meses sin actividad, etc.)
- [ ] **Productos para cross-sell**: ¿qué combinaciones son las más comunes? (ej: curso trading → mentoría, membresía mensual → anual)
- [ ] **Ejemplos de conversaciones reales**: 2-3 chats de seguimiento/upsell
- [ ] **Tono**: ¿como un amigo, como un asesor, como soporte?
- [ ] **¿Qué pasa si el cliente no está contento?** Proceso de retención

### 4. Prospección de afiliados
- [ ] **Perfil de afiliado ideal**: ¿influencer financiero, deportista, educador, cualquier nicho?
- [ ] **Propuesta estándar**: ¿hay un pitch o presentación que Jorge envía?
- [ ] **Rango de comisiones**: ¿cuál es el rango típico que se negocia? (fijo por lead, % de venta, mixto)
- [ ] **Ejemplos**: ¿cómo fue la negociación con el boxeador u otro afiliado?
- [ ] **Materiales**: ¿qué se le da al afiliado? (link de referido, banners, contenido para compartir)
- [ ] **Seguimiento**: ¿cada cuánto se contacta al afiliado? ¿Qué métricas se comparten?
- [ ] **Canal preferido**: ¿email, LinkedIn, WhatsApp, DM de Instagram?
- [ ] **Volumen objetivo**: ¿cuántos afiliados nuevos quieren captar?
