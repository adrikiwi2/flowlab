const { createClient } = require('@libsql/client');
const crypto = require('crypto');

function nanoid(size = 21) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = crypto.randomBytes(size);
  return Array.from(bytes).map(b => chars[b % 64]).join('');
}

const db = createClient({
  url: 'libsql://flowlab-adrikiwi2.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzMzMTU1MjUsImlkIjoiMDE5Y2M4MmYtZWIwMS03ZGJkLWI3NzUtMDNmY2IxNDViMWYyIiwicmlkIjoiMjMzMzhlODktOTc3My00MjMzLThhNGItNTQ3Y2M2MjljMWI0In0.LTA219nNCP7IRPzoAVHptH1XQwiXn0DFtB7S2bb6rpGfSpypX3fJxIflz6sREB_EtbcZVVrsaj1auosrRCG3CA'
});

const TENANT_ID = 'xQBjnyhFY1oPtmFtDn7U5';

const SYSTEM_PROMPT = `Eres el asistente de ventas de TradingPRO, una academia de inversión y trading fundada por los hermanos José y Álvaro Basagoiti. Tu objetivo es cualificar leads que llegan por Telegram tras ver un anuncio, y guiarlos hacia reservar una llamada con el equipo comercial.

Habla siempre de tú, con un tono cercano y profesional. Nunca presiones. Tu objetivo final es conseguir que el lead reserve una llamada con el equipo (link de calendario) o se apunte a los 3 meses gratis del canal privado.

Si la conversación no encaja con ninguna categoría definida, marca como needs_human para que el equipo comercial intervenga directamente.`;

async function main() {
  const flowId = nanoid();

  // Categorías
  const catGeneral   = nanoid();
  const catProducto  = nanoid();
  const catHot       = nanoid();
  const catInversion = nanoid();
  const catNo        = nanoid();

  // Templates
  const tplBienvenida     = nanoid();
  const tplGancho         = nanoid();
  const tplCalendario     = nanoid();
  const tplDarwinex       = nanoid();
  const tplCalendarioInv  = nanoid();
  const tplCierre         = nanoid();

  // Extract fields
  const efNombre    = nanoid();
  const efIntencion = nanoid();
  const efExp       = nanoid();
  const efProducto  = nanoid();

  // Knowledge doc
  const kdocId = nanoid();

  console.log('Flow ID:', flowId);

  // 1. Flow
  await db.execute({
    sql: `INSERT INTO flows (id, tenant_id, name, description, system_prompt, role_a_label, role_b_label)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      flowId, TENANT_ID,
      'Leads Telegram',
      'Inbound templado — leads que llegan via ads de Instagram/Facebook al canal de Telegram de TradingPRO.',
      SYSTEM_PROMPT,
      'TradingPRO Bot',
      'Lead'
    ]
  });
  console.log('✓ Flow creado');

  // 2. Categorías
  const cats = [
    {
      id: catGeneral, name: 'Interes general', color: '#6366f1', mode: 'template', sort: 0,
      rules: 'Lead nuevo o sin intencion clara. Responde de forma generica sobre inversion o trading pero no hace preguntas concretas sobre productos. Saluda, pregunta de que va TradingPRO o no dice nada especifico. Aqui tambien caen los mensajes de bienvenida iniciales.'
    },
    {
      id: catProducto, name: 'Pregunta sobre productos', color: '#f59e0b', mode: 'knowledge', sort: 1,
      rules: 'Lead que pregunta sobre precios, contenido de cursos, diferencias entre productos (Curso Inversion y Trading vs Mentoria), que incluye la membresia PROINVESTOR, cuanto cuesta, que aprendera, duracion, temario, garantias, etc.'
    },
    {
      id: catHot, name: 'Hot lead / quiere hablar', color: '#22c55e', mode: 'template', sort: 2,
      rules: 'Lead con intencion clara de avanzar: dice que quiere apuntarse, que esta listo, que le interesa mucho, que quiere hablar con alguien del equipo, que tiene preguntas para cerrar la compra, o que ya tiene experiencia y busca nivel avanzado.'
    },
    {
      id: catInversion, name: 'Quiere invertir dinero', color: '#3b82f6', mode: 'template', sort: 3,
      rules: 'Lead que quiere invertir su dinero directamente, no formarse. Menciona que tiene capital para invertir, que busca un broker, que quiere que le gestionen la cartera, o que pregunta por rentabilidades y comisiones.'
    },
    {
      id: catNo, name: 'No interesado', color: '#ef4444', mode: 'template', sort: 4,
      rules: 'Lead que rechaza explicitamente, dice que no le interesa, que se equivoco de canal, que no tiene tiempo, que ya tiene formacion suficiente, o que quiere darse de baja del canal.'
    }
  ];

  for (const c of cats) {
    await db.execute({
      sql: 'INSERT INTO categories (id, flow_id, name, color, rules, sort_order, mode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [c.id, flowId, c.name, c.color, c.rules, c.sort, c.mode]
    });
  }
  console.log('✓ 5 categorias creadas');

  // 3. Templates
  const templates = [
    {
      id: tplBienvenida, catId: catGeneral, name: 'Bienvenida',
      body: `Hola {{nombre}}! Bienvenido al canal de TradingPRO.

Soy el asistente del equipo. Veo que has llegado desde nuestro anuncio, me alegra que estes aqui.

Cuentame un poco: que te ha llevado a interesarte por el trading o la inversion? Tienes ya algo de experiencia o partes desde cero?`
    },
    {
      id: tplGancho, catId: catGeneral, name: 'Gancho 3 meses gratis',
      body: `Perfecto, {{nombre}}. Antes de contarte mas, tenemos algo especial para que lo compruebes sin riesgo:

3 meses gratis en nuestro canal privado PROINVESTOR, donde Jose y Alvaro Basagoiti comparten su portfolio real, los analisis del dia y la TradingRoom en directo.

Normalmente son 100 euros/mes. Para ti, gratis durante 3 meses.

{{link_3_meses_gratis}}

Te apuntas? En cuanto accedas veras de que va esto de verdad.`
    },
    {
      id: tplCalendario, catId: catHot, name: 'Reservar llamada comercial',
      body: `Me alegra que estes decidido, {{nombre}}!

Lo mejor que puedo hacer es conectarte directamente con nuestro equipo: te resuelven todas las dudas en una llamada rapida de 15 minutos y te ayudan a elegir el camino que mejor encaja contigo.

Reserva tu llamada aqui: {{link_calendario}}

Es gratis y sin compromiso. Te va bien esta semana?`
    },
    {
      id: tplDarwinex, catId: catInversion, name: 'Invertir con Darwinex',
      body: `Entendido, {{nombre}}. Si lo tuyo es invertir directamente, TradingPRO trabaja con Darwinex: un broker regulado por CNMV y FCA, con sede en Espana y mas de 140 millones de dolares bajo gestion.

Jose y Alvaro lo recomiendan a sus propios alumnos y ellos mismos operan ahi.

Puedes ver mas info aqui: https://www.darwinex.com/register

Aunque si quieres que alguien del equipo te oriente segun tu perfil y capital, puedo reservarte una llamada. Te interesa?`
    },
    {
      id: tplCalendarioInv, catId: catInversion, name: 'Llamada para inversores',
      body: `La mejor forma de orientarte es hablar directamente con el equipo, {{nombre}}.

Te explican que encaja mejor con tu situacion: si invertir a traves de Darwinex, combinar con formacion, o empezar con cuenta virtual para ver como funciona todo.

Reserva tu llamada aqui: {{link_calendario}}

Sin compromiso, en 15 minutos tienes todo claro.`
    },
    {
      id: tplCierre, catId: catNo, name: 'Cierre cordial',
      body: `Sin problema, {{nombre}}, lo entiendo perfectamente.

Por si en algun momento te surge la curiosidad, tienes acceso gratuito a nuestra formacion introductoria, sin registro ni compromiso:

https://tradingpro.app/formacion/videos

Mucha suerte con todo!`
    }
  ];

  for (const t of templates) {
    await db.execute({
      sql: 'INSERT INTO templates (id, flow_id, category_id, name, body) VALUES (?, ?, ?, ?, ?)',
      args: [t.id, flowId, t.catId, t.name, t.body]
    });
  }
  console.log('✓ 6 templates creados');

  // 4. Extract fields
  const fields = [
    { id: efNombre,    name: 'nombre',           type: 'text', desc: 'Nombre o alias del lead, si lo ha mencionado en la conversacion.' },
    { id: efIntencion, name: 'intencion',         type: 'text', desc: 'Objetivo del lead: "aprender" (quiere formacion), "invertir" (tiene capital para invertir directamente), "ambos", o "no_claro".' },
    { id: efExp,       name: 'experiencia',       type: 'text', desc: 'Nivel de experiencia en inversion o trading: "ninguna", "basica", "intermedia" o "avanzada".' },
    { id: efProducto,  name: 'producto_interes',  type: 'text', desc: 'Producto de TradingPRO mas mencionado: "curso", "mentoria", "membresia", "canal_telegram", "darwinex", o "no_definido".' }
  ];

  for (const f of fields) {
    await db.execute({
      sql: 'INSERT INTO extract_fields (id, flow_id, field_name, field_type, description) VALUES (?, ?, ?, ?, ?)',
      args: [f.id, flowId, f.name, f.type, f.desc]
    });
  }
  console.log('✓ 4 extract fields creados');

  // 5. Knowledge doc
  const kdocText = `# TradingPRO — Productos y servicios

## Oferta formativa

### Mas que Mercados (GRATUITO)
- URL: https://tradingpro.app/formacion/mas-que-mercados
- Precio: Gratis (requiere registro)
- Formato: En directo, lunes a jueves de 15:30h a 17:00h
- Que aprenderas: mercados financieros, tendencias economicas globales, relacion mercados-economia, impacto de politica economica en mercados.

### Curso Inversion y Trading — 1.590 euros (PVP 2.070 euros)
- URL: https://tradingpro.app/formacion/cursos/inversion-y-trading
- Para traders: analisis tecnico, estrategias de trading, lectura de mercados a corto plazo.
- Incluye: acceso de por vida, actualizaciones gratuitas, soporte prioritario, 6 meses en comunidad privada con TradingRoom diaria y portfolio de Jose y Alvaro.
- Mas de 1.000 alumnos. 13 capitulos (desde independencia financiera hasta Bitcoin y ETFs).

### Programa Mentoria Inversion — 1.590 euros (PVP 2.070 euros)
- URL: https://tradingpro.app/formacion/cursos/programa-mentoria-inversion
- Para inversores a medio y largo plazo: cartera personalizada, analisis fundamental, gestion patrimonial.
- Mentores: Jose y Alvaro Basagoiti. 6 meses de acompanamiento personalizado.
- Garantia 30 dias. 10 capitulos (desde perfil inversor hasta automatizacion de finanzas).

### Diferencia clave entre Curso y Mentoria
- Curso: para traders (corto plazo, analisis tecnico, operativa activa)
- Mentoria: para inversores (medio/largo plazo, cartera, analisis fundamental, finanzas personales)
- Ambos incluyen 6 meses de membresia PROINVESTOR.

### Membresia PROINVESTOR
- URL: https://tradingpro.app/membresia-trading-tradingpro
- Mensual: 100 euros/mes | Semestral: 540 euros | Anual: 960 euros
- Incluye: TradingRoom diaria, portfolio real de Jose y Alvaro, research semanal, comunidad privada, eventos, acceso al gestor IA TPRO, todos los articulos de pago.

### Videos gratuitos / Miniclases
- URL: https://tradingpro.app/formacion/videos
- Gratis. Estrategias, analisis de mercado, gestion de inversiones.

## Gancho principal: 3 meses gratis del canal privado
- Equivale a la membresia PROINVESTOR (100 euros/mes)
- Incluye: TradingRoom diaria con Jose y Alvaro, portfolio compartido
- Link de registro: {{link_3_meses_gratis}}

## Broker recomendado: Darwinex
- Regulado por CNMV (Espana) y FCA (UK). Sede en Espana.
- Mas de 140M en AuM, mas de 10 anos, mas de 1.500 instrumentos.
- Registro: https://www.darwinex.com/register
- Darwinex Zero (cuenta virtual, 45 euros/mes): https://www.darwinexzero.com/
- Ideal para leads que quieren invertir directamente, no solo formarse.

## Fundadores
- Jose y Alvaro Basagoiti: hermanos, duenos de TradingPRO, imparten personalmente las clases y gestionan el portfolio compartido.
- Autores: "Entendamos el Trading" (Ediciones Piramide).
- Docentes en UC3M y URJC. Colaboradores en Intereconomia, Rankia, finanzas.com.
- El abuelo Basagoiti fue fundador del Banco Hispanoamericano (argumento de autoridad util para leads mayores de 40 anos).

## Datos de conversion
- CPA actual: 100 euros/cliente
- Tasa de conversion: 10%
- Responsable comercial: Jorge Batres`;

  await db.execute({
    sql: 'INSERT INTO knowledge_docs (id, flow_id, name, doc_type, content_text, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    args: [kdocId, flowId, 'Productos y servicios TradingPRO', 'text', kdocText, 0]
  });
  console.log('✓ Knowledge doc creado');

  console.log('');
  console.log('=== LISTO ===');
  console.log('Flow ID:', flowId);
  console.log('Tenant: Tradingpro (' + TENANT_ID + ')');
}

main().catch(console.error);
