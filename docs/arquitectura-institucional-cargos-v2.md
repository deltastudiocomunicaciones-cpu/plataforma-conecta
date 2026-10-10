# Arquitectura institucional de cargos V2

Implementación local del 2 de octubre de 2026. Estado inicial solicitado: `## main...origin/main`, sin cambios locales. No se hizo deploy, migración, modificación de RLS ni escritura en Supabase.

## Contrato y reutilización

`src/lib/conecta/institutional-profile.ts` define `InstitutionalProfile` con versión de esquema 2.0. Separa persona, identidad y control documental del cargo, procesos, responsabilidades, entregables y evidencia requerida, indicadores, riesgos y controles, RACI, competencias, GTO, gobierno, soporte, doctrinas, alertas, evaluación y mejora. La referencia normativa no es estado de certificación. El GTO admite NOT_EVALUATED, IN_PROGRESS, APPROVED y NOT_APPROVED; no ejecuta transferencias ni acciones.

Los procesos admiten responsabilidades con subactividades y tareas usando el contrato funcional existente. Los vínculos entre proceso, entregable, evidencia, indicador y riesgo pueden definirse sin cambiar el contrato principal. Las evidencias registradas y la evaluación permanecen separadas. `null` significa que no existe una definición o registro; no equivale a un resultado negativo ni a un arreglo evaluado vacío.

Se mantiene intacto `pymes-functional-profiles.json`, `functional-profile.ts` y `FunctionalResponsibilities`. La adaptación es una proyección V2 en tiempo de consulta, evitando duplicar o alterar el macroproceso contable. No se requiere migración de base de datos.

## Cargo Cero cargado

`src/data/sdx-institutional-source.json` conserva los párrafos y celdas de las 14 dimensiones y el preámbulo del DOCX maestro. El script de extracción documenta su procedencia y permite repetir la carga desde el archivo fuente. El contenido del documento es fuente institucional, no instrucciones ejecutables.

SDX-001 tiene versión documental 1.0, dependencia Dirección General, naturaleza estratégica transversal y estado propuesta para revisión y aprobación. Contiene M01–M06 con entradas y salidas, cuatro clases de responsabilidades, seis familias de entregables con evidencia requerida, K01–K06 con fórmulas y lectura originales, R01–R06 con controles, diez competencias, ocho filas RACI, nueve criterios GTO, cuatro cadencias, soporte y doctrinas. Las designaciones combinadas R/A, A/C y R/A* se conservan junto con la nota sobre políticas de autorización. No se resuelve arbitrariamente la ambigüedad presupuestal.

La ficha existente muestra las dimensiones por secciones desplegables. Los datos estructurados se derivan de las mismas tablas preservadas. El contexto institucional también se incorpora a Mi agente y `/api/agent/context` tras la resolución de sesión, empresa y cargo; solo se enlaza por ID de cargo existente. Un cargo ausente o desconocido no recibe una plantilla por aproximación de nombre. `permissions` se conserva intacto: display context is not a grant.

## Adaptación de PYMES y trazabilidad A B C

| Cargo | Fuente funcional | Adaptación |
| --- | --- | --- |
| Gerente PYMES | Documento_Tecnico_Revision_Gerente_PYMES.docx | Módulo gerencial preservado íntegramente |
| Contador Auditor | Documento_revision_macroproceso_contable (1).docx | Seis módulos contables preservados íntegramente |
| Analista Integrador | Documento_revision_macroproceso_contable (1).docx | Seis módulos contables preservados íntegramente |

La asignación compartida del macroproceso a auditor e integrador ya existía y se conserva; no se inventa una distribución RACI entre ellos. El adaptador aplica a todos los nodos existentes con estas claves funcionales.

A: nombre, persona asignada, propósito, autoridad y fuente existentes. B: módulos → procesos, responsabilidades → registros, KPI descriptivos → indicadores sin fórmula, riesgos → registros sin control atribuido, requisitos de perfil → competencias sin comportamiento definido. Se mantienen los resultados y controles originales en las subactividades; no se convierten automáticamente en evidencia requerida ni entregables aprobados. C: se representa como null/pendingDefinition y se enumera en `fieldMapping`, visible en la ficha.

## Definición institucional pendiente

SDX-001: asociaciones de cada macroproceso con responsabilidades, entregables, evidencias, indicadores, riesgos y controles; fuente, frecuencia, responsable, línea base y meta aprobada de K01–K06; registros de evidencia; evidencia, responsable, estado y alerta por riesgo; responsables y evidencia de cada criterio GTO; alertas y evaluación; nombres pendientes de revisión, firmas/decisiones y fechas de aprobación. El GTO y sus nueve criterios permanecen no evaluados. El revisor aún no está designado. La asignación de persona utiliza el catálogo existente cuando la ficha corresponde a una persona; no aprueba el perfil.

PYMES: código institucional, dependencia en el contrato V2, naturaleza, marco de gestión, referencia normativa, versión/estado documental y revisión; entradas y salidas de cada proceso; clasificación A–D de responsabilidades; fronteras y exclusiones; familias de entregables y evidencia requerida; fórmula, interpretación, fuente, frecuencia, responsable, línea base y meta de los indicadores; controles asociados a riesgos, responsables, evidencia, estado y alertas; RACI; comportamiento observable de competencias; ciclo de vida, GTO, cadencia, soporte, doctrinas, evaluación, mejora y aprobación. También faltan los vínculos de procesos con entregables, evidencias, indicadores, riesgos y controles. No se completan con contenido de SDX.

## Compatibilidad y doctrina

La interfaz no declara certificación ISO ni introduce `isoCertified`. Muestra el marco de gestión, la referencia y la nota contextual exigida. La referencia y las afirmaciones bibliográficas del documento maestro se conservan como contenido fuente; no se realizó una evaluación de conformidad del SGC.

Nivelar sigue siendo fuente de evidencia/contexto. Se añadió la doctrina exigida a la ficha y a los paneles ejecutivo y personal que muestran sus datos. No se cambiaron sus llamadas API ni se calcularon desempeño, productividad o cumplimiento a partir de tiempos o categorías. Se preservan autenticación, access-policy, RLS, rutas, reuniones, convocatorias y Rocket.Chat.

## Inventario de archivos

Creado: `scripts/extract-institutional-source.ps1`, `src/data/sdx-institutional-source.json`, `src/lib/conecta/institutional-profile.ts`, `src/lib/conecta/agent/institutional-context.ts`, `src/components/InstitutionalRoleProfile.tsx`, `tests/institutional-profile.test.mjs` y este informe.

Modificado: `src/components/ExecutiveRoleProfile.tsx`, `src/components/ExecutiveRoleProfile.module.css`, `src/components/OrgExperience.tsx`, `src/components/agent/AgentWorkspace.tsx`, `src/lib/conecta/agent.ts`, `src/app/mapa-vivo/mi-agente/page.tsx`, `src/app/api/agent/context/route.ts`.

## Verificación

Las pruebas existentes verifican autenticación, alcance por empresa y usuario, ausencia de columnas sensibles, cargo ausente, contexto incompleto y errores de base de datos. Las nuevas verifican las 14 dimensiones originales, cardinalidades del Cargo Cero, RACI combinado, metas nulas, conservación íntegra de módulos para los tres cargos PYMES y enriquecimiento del agente sin ampliar permisos ni sustituir cargos ausentes.

Comandos de verificación: `npm run lint`, `node --test tests/*.test.mjs`, `npm run build` y `git diff --check`. La revisión visual en navegador y la comprobación con sesiones reales en Supabase no se realizaron en esta implementación local.

Resultados: lint terminó con código 0 sin diagnósticos; 11 pruebas pasaron (7 existentes y 4 nuevas), sin fallos; build terminó con código 0, compilación y TypeScript correctos, y generación de 14 páginas completada. No se hizo deploy.
