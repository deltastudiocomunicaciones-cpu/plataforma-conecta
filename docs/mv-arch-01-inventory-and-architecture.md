# MV-ARCH-01 — Memoria Viva: inventario y arquitectura del primer incremento

## Alcance y dictamen

Este documento describe el estado observado en el repositorio y el prototipo presentado por esta entrega. No acredita que migraciones candidatas estén aplicadas en Supabase ni habilita escrituras institucionales. La UI implementada es una demostración de sesión: no persiste, no consulta un directorio de personal, no envía invitaciones, no registra asistencia ni permite aprobación o cierre.

El texto pegado de la orden fue la fuente de requisitos. El manual independiente «Manual maestro de arquitectura y codificación documental — Memoria Viva V1.0» no estaba entre los archivos disponibles para inspección; por tanto, no se afirma haberlo cotejado íntegramente. Se consultaron el contrato y las decisiones de arquitectura que sí están en `docs/`.

## Inventario del producto existente

| Área | Implementación encontrada | Límite observado |
|---|---|---|
| Memoria Viva | `/memoria-viva` presenta `MemoryDemoExperience`; `MemoryDesk`, `MemoryCapture`, `MemoryMinutes`, `MemoryTimeline`, `MemoryRecord`, `DecisionTrace`, `OrganizationalKnowledge` y `MinuteLifecycle` componen el recorrido | Fixtures de demostración y estado React local, perdido al recargar; sin operación de memoria persistente |
| PDF de acta | `src/lib/conecta/memory-minute-pdf.ts` crea el PDF de borrador desde Canvas | No representa una presentación institucional aprobada; se conserva la descarga del formato oficial en blanco `public/templates/conecta-acta-v1-en-blanco.pdf` |
| Convocatorias | `/convocatorias` muestra reuniones; `/api/meeting-events` protege las operaciones privadas mediante sesión/perfil | RSVP público acepta nombre y rol declarados por la persona que responde; eso no verifica identidad, asistencia o pertenencia al personal |
| Modelo de reuniones | `meeting_events` y `meeting_responses` se declaran en `supabase/canonical/migrations/0003_conecta_meetings.sql` | La raíz de evento/convocatoria no equivale a acta ni a asistencia confirmada |
| Mapa Vivo | `src/data/grupo-ac-org.json` contiene unidades, cargos, relaciones y campos de proceso como catálogo de presentación | El archivo también contiene información personal. El prototipo usa únicamente IDs y títulos saneados; la adscripción mostrada no se valida contra un directorio operativo |
| Identidad y autorización | `user_profiles`, Auth y cargos/unidades se describen en schema y `src/lib/conecta/access-policy.ts` | No se encontró un endpoint de lectura de directorio aprobado ni permisos por recurso para Memoria Viva |
| Modelo candidato de memoria | Existen `0005_conecta_memory_core.sql`, `0006_conecta_memory_tenant_integrity_rls.sql` y documentos F2/G2 | Son artefactos del repositorio; su aplicación remota no se verificó. Los tipos de aplicación no incluyen `meeting_minutes` y no hay operaciones de dominio conectadas a estas tablas |
| Auditoría y archivos | `report_reviews` pertenece al flujo de reportes | No se encontró una bitácora general de Memoria Viva. El almacenamiento binario permanece bloqueado por el gate de arquitectura |

## Incremento presentado

La navegación de Memoria Viva agrupa el prototipo en **Producción documental**, **Archivo institucional** e **Inteligencia documental**. La producción permite crear el borrador de un acontecimiento, seleccionar participantes ficticios mediante búsqueda por nombre/cargo/unidad, elegir unidad productora y elaborar una vista previa. La lista indica que sus datos son ficticios y que la unidad es solo referencia del prototipo. El filtro de unidad y la selección múltiple son locales.

El borrador distingue tipo de acontecimiento, asunto, proceso, datos temporales, unidad de referencia, personas convocadas, condición de participación y RSVP. Un RSVP vacío se presenta como no consultado; la selección de una persona no significa invitación enviada, asistencia ni relación laboral. La convocatoria vinculada es un fixture estático: no se consulta ni modifica Convocatorias.

El archivo permite buscar y filtrar los registros de muestra por código, asunto, unidad, tipo y estado, y abrir una ficha de contexto. Los códigos visibles son identificadores de muestra, no códigos oficiales ni UUID persistentes. La inteligencia documental conserva las vistas de línea de memoria, ficha, reconstrucción causal y conocimiento organizacional; sus etiquetas no afirman validación institucional.

El ciclo de vida se presenta como referencia explicativa de solo lectura. No hay acción de aprobación, cierre o envío. El PDF del borrador permanece como vista de demostración; el formato en blanco institucional se conserva como descarga separada.

## Separación de conceptos y modelo propuesto

La unidad, el cargo, la persona, el evento, la convocatoria/RSVP, la asistencia, el acta, sus versiones y las decisiones/compromisos son entidades distintas. Los datos de cargo/unidad deben provenir de referencias institucionales durables, mientras que el evento y cada versión del acta conservan sus hechos y snapshots históricos. La persona invitada no se convierte en asistente por estar listada; RSVP no acredita asistencia.

Modelo conceptual a concretar en slices autorizados:

1. `meeting_events` sigue siendo la raíz existente de un acontecimiento organizacional; una convocatoria pública es una faceta opcional, no una segunda raíz.
2. Un evento puede tener como máximo un acta lógica. Cada edición posterior conserva la identidad del acta y genera una revisión inmutable.
3. Las personas convocadas, respuestas RSVP y hechos de asistencia se conservan por separado. La asistencia exige confirmación de un actor autorizado.
4. La revisión agrupa participantes/contexto, agenda, hallazgos, decisiones y compromisos; cada elemento conserva su origen y revisión.
5. El archivo y la búsqueda consultan registros persistidos solo después de resolver autenticación, tenant y autorización por recurso.
6. Los anexos requieren metadata, política de acceso y gate independiente para almacenamiento de binarios; no se habilita carga en este incremento.
7. El registro GAC visible en la presentación necesita códigos gobernados por organización/unidad/tipo y autoridad de numeración. No se inventa un código ni se asigna UUID desde cliente.

La referencia del catálogo actual se limita a títulos e IDs saneados existentes en el Mapa Vivo. No convierte `area`, `businessUnit` o `processes[]` en identificadores durables de proceso, ni crea códigos institucionales nuevos.

La propuesta de catálogo maestro contempla `id` técnico, código estable, nombre, tipo de entidad, unidad superior, vigencia, estado y fuente de procedencia. Debe distinguir órganos de gobierno, unidades, procesos, cargos, personas y convenios; un convenio es una relación institucional externa, no un cargo. El patrón visible `GAC-UNIDAD-TIPO-AÑO-CONSECUTIVO` se mantiene como propuesta de gobierno pendiente de conciliación y aprobación. El UUID técnico es independiente, inmutable y no se presenta como código documental. La asignación secuencial oficial requiere un contador transaccional del servidor y nunca se simula desde el navegador.

## Seguridad y preparación pendiente

Antes de operar datos reales se requiere confirmar el estado de base remota; validar el vínculo de `user_profiles.id` con Auth, empresa y asignaciones activas; definir acceso por recurso según tenant, custodia, participación y autoridad; separar autor y aprobador; impedir autoaprobación; diseñar auditoría append-only y correcciones versionadas; y aprobar política privada de almacenamiento. El privilegio técnico o la pertenencia a la empresa no conceden por sí solos lectura o aprobación.

Las migraciones 0005/0006 no se ejecutaron ni se modificaron en esta intervención. Tampoco se alteraron RLS, permisos, Auth, APIs, variables de entorno, dependencias, Nivelar o integraciones externas. No se verificó infraestructura Supabase remota.

## Decisiones institucionales abiertas

- Confirmar el manual maestro mencionado por la orden y su relación con el contrato y la decisión MV-G2 existentes.
- Aprobar el catálogo de unidades/cargos/procesos y sus códigos/versiones, evitando inferir identidad durable de etiquetas del Mapa Vivo.
- Aprobar reglas de convocatoria interna, elegibilidad, confirmación de asistencia, zona horaria y quórum.
- Designar custodios, redactores, revisores y autoridad aprobadora; resolver segregación e identidad validada.
- Definir numeración oficial GAC y correspondencia entre memoria, evento, decisiones y compromisos.
- Resolver retención, acceso por recurso, auditoría, privacidad, anexos y política de almacenamiento después del gate requerido.
- Confirmar cuáles actas/datos de muestra pueden migrar y quién valida su fidelidad antes de cargar datos reales.

## Clasificación de capacidades

| Capacidad | Estado de esta entrega |
|---|---|
| Tres áreas de navegación y recorridos visuales | Presentado como prototipo DEMO |
| Búsqueda y selección múltiple de directorio | Fixture ficticio en memoria local; directorio real no disponible |
| Borrador, RSVP, asistencia y relación con convocatoria | Diferenciados en el modelo de pantalla; no hay escritura ni verificación |
| Archivo y filtros | Registros de muestra locales; sin consulta remota |
| PDF de borrador y plantilla en blanco | Generación/descarga existente conservada; no se afirma aprobación documental |
| Persistencia, API de memoria y búsqueda institucional | No implementadas |
| Aprobación/cierre, auditoría y autorización por recurso | No implementadas; bloqueadas por gates institucionales |
| Migración, RLS y Storage | No ejecutados ni modificados |

