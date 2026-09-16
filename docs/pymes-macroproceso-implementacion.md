# Actualización funcional PYMES

## Alcance registrado

- Gerente PYMES: José Fernando Palacios (`gerencia-09`).
- Contadores Auditores: Jhonatan Alvarez, Yuranny Córdoba, Julio Medina y Anderson Osorio. Conservan sus identificadores actuales y reportan al gerente.
- Analistas Integradores: Estiven Sanchez y Diana Bernal.
- Estiven reporta directamente a José Fernando Palacios, según la aclaración del usuario.
- Diana reporta a Yuranny Córdoba (`unidad-pymes-02`).

La etiqueta junto a la foto muestra el cargo y conserva el nombre de la persona. Las tarjetas del mapa también muestran esa distinción. La dependencia directa de Estiven es una excepción explícita a la secuencia general Gerente → Contador Auditor → Analista Integrador.

## Arquitectura de las fichas

En Responsabilidades principales:

1. Módulo del macroproceso.
2. Responsabilidad (actividad del documento, con código original).
3. Subactividad desplegable.
4. Desplegables independientes de Tareas, Control y Resultado.

Para las fichas funcionales PYMES se elimina la sección redundante de Actividades. Los otros cargos conservan la ficha anterior. La impresión de la ficha incluye toda la estructura, sin depender de cuáles desplegables estén abiertos.

## Fuentes y fidelidad

- `Documento_Tecnico_Revision_Gerente_PYMES.docx`: 7 responsabilidades, 14 subactividades, 85 tareas. Aplicado al gerente, con el propósito general del documento.
- `Documento_revision_macroproceso_contable (1).docx`: 6 módulos, 36 responsabilidades, 83 subactividades, 273 tareas. Aplicado a los demás miembros PYMES por instrucción del usuario.

El contenido de tareas, controles y resultados se importa literalmente. El script `scripts/import_pymes_profiles.py` recibe la carpeta de los dos DOCX y genera el catálogo compartido `src/data/pymes-functional-profiles.json`. Rechaza párrafos desconocidos, códigos duplicados, asociaciones inválidas y subactividades sin tareas, control o resultado. Las listas simples del organigrama se mantienen como proyecciones del catálogo para búsqueda y compatibilidad con los consumidores existentes.

Los documentos se identifican como borradores técnicos; la carga se realiza por instrucción expresa del usuario, sin inventar firmas ni constancias de aprobación. El segundo documento contiene funciones de supervisión y aprobación además de ejecución. Su uso compartido no otorga permisos ejecutables a los analistas. Una futura separación funcional más detallada deberá precisar cuáles tareas corresponden a ejecución y cuáles a validación independiente.

## Archivos

Modificados:
- `src/data/grupo-ac-org.json`: nombres de cargos, dependencias, propósito y proyecciones funcionales PYMES.
- `src/components/ExecutiveRoleProfile.tsx`: cargo junto a la foto y responsabilidades estructuradas.
- `src/components/ExecutiveRoleProfile.module.css`: estilos de módulos y desplegables anidados, con adaptación móvil.
- `src/components/OrgExperience.tsx`: etiquetas del mapa y exportación completa de funciones.

Creados:
- `src/data/pymes-functional-profiles.json`: catálogo único del detalle de los dos informes.
- `src/lib/conecta/functional-profile.ts`: tipos y resolución del catálogo.
- `src/components/FunctionalResponsibilities.tsx`: componentes reutilizables de responsabilidades y desplegables.
- `scripts/import_pymes_profiles.py`: importador de documentos.
- `docs/pymes-macroproceso-implementacion.md`: este registro.

## Validación

- Compilación de producción (npm run build): aprobada.

- Importación estructural de todos los párrafos funcionales: aprobada.
- Correspondencia entre catálogo compartido y responsabilidades/subactividades de las siete fichas: aprobada.
- Identificadores únicos, padres existentes, ausencia de ciclos, dos únicos analistas y dependencias aclaradas: aprobado.
- TypeScript y ESLint dirigido a los archivos TS/TSX modificados: aprobados.
- Renderizado HTTP de la revisión local: 200, con Contador Auditor, Tareas, Control, Resultado, último módulo y acceso al agente presentes.
- Verificación visual interactiva: pendiente; el navegador integrado no logró adjuntar la pestaña en dos intentos. No se afirma haber validado capturas de escritorio o móvil.

## Límite de la actualización

El mapa y las fichas leen el catálogo local. No se modifican credenciales, permisos, asignaciones operativas ni registros de Supabase. La sincronización de estas definiciones con `positions` sigue siendo necesaria para que el workspace del agente, que consulta el backend, reciba el mismo contexto. No se aplican escrituras remotas ni se amplía el acceso de los analistas por cambiar su etiqueta de cargo.

## Formato de tareas — 16 de septiembre de 2026

Por solicitud del usuario, las tareas de Contadores Auditores y Analistas Integradores se presentan dentro de su desplegable como un párrafo: **Tareas:** primera tarea • segunda tarea. Se conserva íntegro el contenido del catálogo y el mismo formato en la impresión de la ficha. La ficha del Gerente PYMES conserva su lista.

Validación: TypeScript, ESLint dirigido y build de producción aprobados. Revisión visual en sesión autenticada pendiente.
