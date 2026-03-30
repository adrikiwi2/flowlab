Genera el contexto completo de FlowLab para empezar a trabajar. Combina fuentes locales (CLAUDE.md) con el estado actual en Linear.

## Argumentos
$ARGUMENTS — Ignorado. Este comando siempre opera sobre FlowLab.

## Instrucciones

### Paso 1: Leer contexto local (en paralelo)

Lee lo que exista (no fallar si falta alguno):

1. `CLAUDE.md` — arquitectura, stack, comandos clave. Extraer: stack, patrones clave, comandos de arranque
2. `.hub/vision.md` — visión y objetivo del proyecto
3. `.hub/setup.md` — requisitos de entorno
4. `.hub/decisions/` — leer el archivo más reciente
5. `README.md` — si no hay CLAUDE.md ni vision.md

---

### Paso 2: Consultar Linear (en paralelo con Paso 1)

- `list_issues(team: "Flowlab", state: "In Progress")` — issues activos
- `list_issues(team: "Flowlab", state: "Todo", priority: 2)` — próximos High
- `list_issues(team: "Flowlab", state: "Todo", priority: 1)` — próximos Urgent

---

### Paso 3: Generar briefing

Formato de salida — máximo 1 pantalla, conciso y accionable:

```
─────────────────────────────────────────
  FLOWLAB · wctx
─────────────────────────────────────────

Vision: [1 línea de vision.md o summary del proyecto en Linear]

Stack: [stack clave extraído de CLAUDE.md]
Arrancar: npm run dev (localhost:3000)

─── En progreso (Linear) ───────────────
  [ID] · [Título] · [Milestone]

─── Próximos (Urgent / High) ───────────
  [ID] · [Título] · [Prioridad]

─── Última decisión ────────────────────
  [Fecha] [Título de la decisión]
  → [1 línea con la decisión tomada]

─── Para empezar ───────────────────────
  • [Acción concreta 1 basada en issues activos]
  • [Acción concreta 2]
─────────────────────────────────────────
```

---

## Reglas

1. **Concisión ante todo**: el briefing debe orientar en menos de 30 segundos
2. **"Para empezar"** es la sección más importante — debe derivar de los issues activos y el contexto local
3. Si no hay issues In Progress, indicarlo y sugerir `/linear todo` para ver el backlog
4. Si hay issues bloqueados, destacarlos con aviso
5. No inventar información — si algo no está en los archivos ni en Linear, omitirlo
