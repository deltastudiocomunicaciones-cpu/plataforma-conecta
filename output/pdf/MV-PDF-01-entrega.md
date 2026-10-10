# MV-PDF-01 - Entrega

Baseline: main, e48b7101ef669d2c951846c659fbc5bb707198e8.
Destino: origin/codex/mv-pdf-01, https://github.com/deltastudiocomunicaciones-cpu/plataforma-conecta.git.
Base autorizada: 99a3cbe (ruta /memoria-viva, diez componentes, datos y tipos sintéticos, dependencia InstitutionalConnections y sus siete líneas de estilos existentes).
Incremento: 7c9371610b7ccbd1f4a682b21b53b4bd217e1f39.
Push correcto; hash remoto verificado. Staging final vacío.

## Archivos del incremento
- src/components/memory/MemoryMinutes.tsx: botón y manejo de descarga/error.
- src/lib/conecta/memory-minute-pdf.ts: exportación A4 local de la instancia, sin dependencia nueva.
- tests/memory-minute-pdf.test.mjs: fidelidad, paginación y descarga local.
- docs/templates/conecta-acta-v1-en-blanco.pdf: cinco páginas A4 para escritura manual, sin valores prellenados.
- .gitattributes: regla específica para conservar el PDF como binario.

## Validación
- Copia exacta de staging exportada y compilada: npm run build, PASS.
- Suite completa de esa copia: 10/10 pruebas, PASS.
- ESLint de componentes y exportación: PASS.
- git diff --cached --check: PASS.
- Descarga real en Chrome de borrador y revisión: PASS (verificación del incremento anterior, código sin cambios).
- PDFs de instancia de tres páginas y estrés de nueve páginas renderizados y revisados visualmente.
- Formato en blanco de cinco páginas renderizado y revisado visualmente, sin campos prellenados.
- SHA256 del formato en blanco idéntico en archivo local y copia seleccionada.

La exportación de la instancia usa páginas rasterizadas: texto no seleccionable. El formato en blanco conserva texto vectorial y renglones para diligenciar a mano. Memoria Viva continúa siendo una experiencia demostrativa sin persistencia; no acredita aprobación institucional real.

Los otros cambios preexistentes permanecen en el workspace y no se publicaron. No se ejecutaron deploy, migraciones ni modificaciones remotas de Supabase o autenticación. Se retiraron únicamente los temporales propios de verificación.

Diffs revisables: MV-PDF-01-base-autorizada.diff y MV-PDF-01-increment-final.diff. Estado final: MV-PDF-01-git-final.txt.
