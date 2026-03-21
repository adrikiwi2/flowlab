/**
 * Rediseño flow "Leads Orgánicos" IberoExpress en PROD (Turso)
 * Ejecutar: node scripts/redesign-leads-organicos.mjs
 *
 * CAMBIOS:
 * - Elimina 2 knowledge docs + 3 categorías (knowledge + HORECA + Precios)
 * - Renombra 4 categorías existentes
 * - Crea 2 categorías nuevas (sin_cualificar, datos_recibidos)
 * - Reemplaza templates de las categorías renombradas
 * - Categorías needs_human quedan sin templates (la IA no responde, solo escala)
 */

import { createClient } from "@libsql/client";
import { nanoid } from "nanoid";

const db = createClient({
  url: "libsql://flowlab-adrikiwi2.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzMzMTU1MjUsImlkIjoiMDE5Y2M4MmYtZWIwMS03ZGJkLWI3NzUtMDNmY2IxNDViMWYyIiwicmlkIjoiMjMzMzhlODktOTc3My00MjMzLThhNGItNTQ3Y2M2MjljMWI0In0.LTA219nNCP7IRPzoAVHptH1XQwiXn0DFtB7S2bb6rpGfSpypX3fJxIflz6sREB_EtbcZVVrsaj1auosrRCG3CA",
});

const FLOW_ID = "xZJX2B7hDOELmLBhnDyrp";

// IDs actuales (consultados de Turso)
const IDS = {
  cats: {
    interes_distribuir:   "yQCtHKF2GRev-uGwmmQXS", // → consulta_producto_b2b
    info_general:         "KvufKYicP4iWkDDl8mVy4", // → pregunta_general
    precios_condiciones:  "FvueBaILSzXJxYEsHL_-i", // DELETE
    ya_soy_cliente:       "4g_zLPWa0EIZV_JBT-yu1", // keep + needs_human rules
    consumidor_final:     "OST9pF6-RU3KBCw0WlHLo", // → b2c_detectado
    proveedor:            "r7ylIy8u8linTzGZB-USn",  // keep + needs_human rules
    queja:                "1pFoypAlAF84--IGiI7zT",  // keep + needs_human rules
    spam:                 "nnvH1r_dC9baYEt5ocUD0",  // → fuera_de_contexto
    consulta_producto:    "j38xHuR9S7YN41-jOr6nS",  // DELETE (knowledge)
    horeca:               "KZ0tIdiRi_i4PsIsdH4on",  // DELETE
    recetas:              "hIQVXub-rqLWLgE-cpqAL",  // DELETE (knowledge)
  },
  docs: {
    catalogo:  "FqPgtzptlKctk15eefztF",
    recetas:   "xD4x29cUa4km4G-WEmqes",
  },
  // Templates a eliminar (de categorías que desaparecen o se limpian)
  templates_delete: [
    "Lzh_ehPtnwNNp2KhkSMa_", // Saludo + enganche (interes_distribuir)
    "5fkUU5igyCqD4p4Ip0wVN",  // Pedir datos empresa (interes_distribuir)
    "BgdSXQzrA8BGRseedUvjK",  // Pedir contacto (interes_distribuir)
    "lQxtV6aM1x99-2fwgSnsY",  // Cierre (interes_distribuir)
    "qgVljV75h2-9FiMDP6XM5",  // Confirmación con datos (interes_distribuir)
    "1D3hh4R2tt669rn1oejJQ",  // Respuesta info general (info_general → se reemplaza)
    "DajHNVqAZTktQUdr0RNOU",  // Respuesta precios (precios_condiciones)
    "sdQwsg_etMU26NgjtLfSX",  // Derivar a comercial (ya_soy_cliente → needs_human, sin template)
    "JYkcZlFxrE8VwlUL3GYQi",  // Redirigir consumidor (consumidor_final → needs_human)
    "8XCnt8sNOlk6Os1wfHMYN",  // Locales cercanos (consumidor_final)
    "jv8gJpWVAj9uz3Qkn-m1M",  // Derivar proveedor (proveedor → needs_human)
    "B3CmkILb3cswwCPtI-3-A",  // Derivar incidencia (queja → needs_human)
    "ezlEG3CrBw8x7O-xQjR1e",  // Respuesta genérica (spam → se reemplaza)
    "9d9aaI6gGMNmpAHJFFxBq",  // Primer contacto HORECA
    "hXHo7ZjmUvco_Xg77fQAG",  // Derivar a comercial HORECA
  ],
};

async function run() {
  console.log("🔄 Iniciando rediseño flow Leads Orgánicos...\n");

  // 1. Eliminar knowledge docs
  console.log("📄 Eliminando knowledge docs...");
  for (const [name, id] of Object.entries(IDS.docs)) {
    await db.execute({ sql: "DELETE FROM knowledge_docs WHERE id = ?", args: [id] });
    console.log(`  ✓ Eliminado doc: ${name}`);
  }

  // 2. Eliminar templates obsoletos
  console.log("\n📝 Eliminando templates obsoletos...");
  for (const id of IDS.templates_delete) {
    await db.execute({ sql: "DELETE FROM templates WHERE id = ?", args: [id] });
  }
  console.log(`  ✓ ${IDS.templates_delete.length} templates eliminados`);

  // 3. Eliminar categorías que desaparecen
  console.log("\n🗂️  Eliminando categorías obsoletas...");
  const catsToDelete = ["precios_condiciones", "consulta_producto", "horeca", "recetas"];
  for (const key of catsToDelete) {
    await db.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [IDS.cats[key]] });
    console.log(`  ✓ Eliminada categoría: ${key}`);
  }

  // 4. Renombrar / actualizar categorías existentes
  console.log("\n✏️  Actualizando categorías existentes...");

  await db.execute({
    sql: "UPDATE categories SET name = ?, rules = ?, mode = 'template' WHERE id = ?",
    args: [
      "Consulta de producto (B2B)",
      "El lead está cualificado como negocio (B2B) y pregunta por algún producto, precio, disponibilidad o quiere hacer un pedido. Incluye distribuidores, hostelería, restaurantes, tiendas.",
      IDS.cats.interes_distribuir,
    ],
  });
  console.log("  ✓ Interés en distribuir → Consulta de producto (B2B)");

  await db.execute({
    sql: "UPDATE categories SET name = ?, rules = ? WHERE id = ?",
    args: [
      "Pregunta general",
      "El lead hace una pregunta general sobre IberoExpress, sus productos, cobertura o servicios, pero no ha indicado claramente si es un negocio. Responder y cualificar.",
      IDS.cats.info_general,
    ],
  });
  console.log("  ✓ Info general → Pregunta general");

  await db.execute({
    sql: "UPDATE categories SET name = ?, rules = ? WHERE id = ?",
    args: [
      "B2C detectado",
      "El lead ha indicado claramente que es un consumidor particular (no tiene negocio, pregunta para uso personal o familiar).",
      IDS.cats.consumidor_final,
    ],
  });
  console.log("  ✓ Consumidor final → B2C detectado");

  await db.execute({
    sql: "UPDATE categories SET name = ?, rules = ? WHERE id = ?",
    args: [
      "Fuera de contexto",
      "El mensaje no tiene relación con distribución mayorista de alimentación. Spam, saludos sin contexto, temas completamente ajenos.",
      IDS.cats.spam,
    ],
  });
  console.log("  ✓ Spam / irrelevante → Fuera de contexto");

  // Actualizar rules de las categorías needs_human que se mantienen
  await db.execute({
    sql: "UPDATE categories SET rules = ? WHERE id = ?",
    args: [
      "El lead indica que ya es cliente de IberoExpress. Necesita atención personalizada de un comercial.",
      IDS.cats.ya_soy_cliente,
    ],
  });
  console.log("  ✓ Ya soy cliente — rules actualizadas");

  await db.execute({
    sql: "UPDATE categories SET rules = ? WHERE id = ?",
    args: [
      "El lead representa a un proveedor, marca o empresa que quiere colaborar con IberoExpress (no es un cliente comprador).",
      IDS.cats.proveedor,
    ],
  });
  console.log("  ✓ Proveedor / colaboración — rules actualizadas");

  await db.execute({
    sql: "UPDATE categories SET rules = ? WHERE id = ?",
    args: [
      "El lead expresa una queja, reclamación o incidencia relacionada con un pedido, entrega o servicio.",
      IDS.cats.queja,
    ],
  });
  console.log("  ✓ Queja / incidencia — rules actualizadas");

  // 5. Crear categorías nuevas
  console.log("\n➕ Creando categorías nuevas...");

  const sinCualificarId = nanoid();
  await db.execute({
    sql: "INSERT INTO categories (id, flow_id, name, rules, mode, sort_order) VALUES (?, ?, ?, ?, 'template', 1)",
    args: [
      sinCualificarId,
      FLOW_ID,
      "Sin cualificar",
      "El lead pregunta por un producto o muestra interés pero no ha indicado si tiene un negocio. Hay que cualificar antes de continuar.",
    ],
  });
  console.log("  ✓ Creada: Sin cualificar");

  const datosRecibidosId = nanoid();
  await db.execute({
    sql: "INSERT INTO categories (id, flow_id, name, rules, mode, sort_order) VALUES (?, ?, ?, ?, 'template', 2)",
    args: [
      datosRecibidosId,
      FLOW_ID,
      "Datos recibidos",
      "El lead ha enviado sus datos de contacto completos o suficientes (nombre, teléfono o email). Confirmar y cerrar la conversación.",
    ],
  });
  console.log("  ✓ Creada: Datos recibidos");

  // 6. Crear templates nuevos
  console.log("\n📝 Creando templates nuevos...");

  await db.execute({
    sql: "INSERT INTO templates (id, flow_id, category_id, name, body) VALUES (?, ?, ?, ?, ?)",
    args: [
      nanoid(), FLOW_ID, IDS.cats.interes_distribuir,
      "Pedir datos B2B",
      "¡Genial! Para que nuestro equipo comercial te contacte en un máximo de 3 días hábiles, necesito estos datos:\n\n• Nombre del negocio\n• Persona de contacto\n• Teléfono\n• Email\n• Localización\n• Productos de interés\n\n¿Me los confirmas? 😊",
    ],
  });
  console.log("  ✓ Template: Pedir datos B2B");

  await db.execute({
    sql: "INSERT INTO templates (id, flow_id, category_id, name, body) VALUES (?, ?, ?, ?, ?)",
    args: [
      nanoid(), FLOW_ID, datosRecibidosId,
      "Confirmación datos recibidos",
      "¡Perfecto! Hemos registrado tu solicitud. Nuestro equipo comercial se pondrá en contacto contigo en un máximo de 3 días hábiles. 🙌\n\nSi necesitas algo más, no dudes en escribirnos.",
    ],
  });
  console.log("  ✓ Template: Confirmación datos recibidos");

  await db.execute({
    sql: "INSERT INTO templates (id, flow_id, category_id, name, body) VALUES (?, ?, ?, ?, ?)",
    args: [
      nanoid(), FLOW_ID, sinCualificarId,
      "Cualificación B2B",
      "¡Hola! IberoExpress es distribución mayorista de alimentación. ¿Tu consulta es para un negocio (hostelería, restaurante, tienda...)? 😊",
    ],
  });
  console.log("  ✓ Template: Cualificación B2B");

  await db.execute({
    sql: "INSERT INTO templates (id, flow_id, category_id, name, body) VALUES (?, ?, ?, ?, ?)",
    args: [
      nanoid(), FLOW_ID, IDS.cats.info_general,
      "Respuesta general + cualificar",
      "¡Hola! Soy el asistente de IberoExpress, especializado en distribución mayorista de alimentación. Si tienes alguna consulta sobre nuestros productos, estaré encantado de ayudarte. ¿Es para un negocio?",
    ],
  });
  console.log("  ✓ Template: Respuesta general + cualificar");

  await db.execute({
    sql: "INSERT INTO templates (id, flow_id, category_id, name, body) VALUES (?, ?, ?, ?, ?)",
    args: [
      nanoid(), FLOW_ID, IDS.cats.spam,
      "Fuera de contexto",
      "Hola, soy el asistente de IberoExpress — solo puedo ayudar con consultas sobre distribución mayorista de alimentación. Si tienes alguna duda relacionada, escríbenos. 😊",
    ],
  });
  console.log("  ✓ Template: Fuera de contexto");

  // 7. Actualizar timestamp del flow
  await db.execute({
    sql: "UPDATE flows SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    args: [FLOW_ID],
  });

  console.log("\n✅ Rediseño completado.");
  console.log("\n📊 Estado final:");
  const cats = await db.execute({ sql: "SELECT name, mode FROM categories WHERE flow_id = ? ORDER BY sort_order, created_at", args: [FLOW_ID] });
  cats.rows.forEach(r => console.log(`  - ${r[0]} (${r[1]})`));

  const tpls = await db.execute({ sql: "SELECT COUNT(*) as n FROM templates WHERE flow_id = ?", args: [FLOW_ID] });
  console.log(`\n  Templates totales: ${tpls.rows[0][0]}`);

  const docs = await db.execute({ sql: "SELECT COUNT(*) as n FROM knowledge_docs WHERE flow_id = ?", args: [FLOW_ID] });
  console.log(`  Knowledge docs: ${docs.rows[0][0]}`);
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
