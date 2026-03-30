Gestión de issues Linear del proyecto FlowLab desde Claude Code.

## Argumentos
$ARGUMENTS — Subcomando o issue ID. Si vacío, muestra issues In Progress de FlowLab.

## Instrucciones

Parsea `$ARGUMENTS` y ejecuta el subcomando correspondiente:

- **Team Linear:** Flowlab (key: `FLW`)
- **Workspace:** theorystudio

---

### Sin argumentos → Issues de FlowLab

Consulta issues de FlowLab agrupados por estado:

```
## FlowLab — [fecha hoy]

### En progreso
- FLW-4 · Alert Engine — Motor de alertas multi-canal · Urgent

### Todo (High/Urgent)
- FLW-5 · Primer despliegue Leads Orgánicos · High

### Done (últimos 5)
- FLW-3 · ...
```

---

### `<estado>` → Filtrar por estado

Estados válidos: `todo`, `in-progress`, `done`, `backlog`

Ejemplos:
- `/linear done` — issues completados
- `/linear todo` — backlog

---

### `<issue-id>` → Detalle de issue

Ejemplos: `/linear FLW-5`

Usa `get_issue` y muestra:
- Título, estado, prioridad, milestone, labels
- Descripción completa
- Si tiene relaciones (blockedBy, blocks, relatedTo), listarlas

---

### `<issue-id> <nuevo-estado>` → Cambiar estado

Ejemplos:
- `/linear FLW-5 done`
- `/linear FLW-1 in-progress`

Estados válidos: `todo`, `in-progress`, `done`, `cancelled`, `backlog`

Confirmar antes de ejecutar. Tras actualizar, mostrar el issue con el nuevo estado.

---

### `<issue-id> comment <texto>` → Añadir comentario

Ejemplo: `/linear FLW-5 comment "Implementado en commit abc123."`

Usa `save_comment`. Confirmar antes de ejecutar.

---

### `add <título>` → Crear issue rápido

Ejemplo: `/linear add "Añadir soporte para canales de Telegram"`

Crea el issue en FlowLab con:
- Estado: Todo
- Prioridad: Normal (3) por defecto
- Pregunta si quiere añadir descripción, milestone o prioridad distinta

---

## Reglas generales

1. **Scope fijo**: todos los comandos operan sobre el team Flowlab. No hay selección de proyecto
2. **Confirmación**: siempre confirmar antes de escribir (cambiar estado, añadir comentario, crear issue)
3. **Prioridades**: 1=Urgent, 2=High, 3=Normal, 4=Low. Mostrar como texto, no número
4. **Sin resultados**: si no hay issues en ese estado, indicarlo explícitamente
