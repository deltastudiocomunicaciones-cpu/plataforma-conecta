# Empresas a cargo y responsabilidades compactas

## Interfaz

- Los seis módulos contables se presentan como Responsabilidad 01 a Responsabilidad 06, cerrados inicialmente. Cada uno conserva todo el contenido y los desplegables interiores.
- El bloque gerencial conserva Gestión transversal, también plegable.
- Empresas a cargo aparece debajo de Responsabilidades principales para Contadores Auditores y Gerente PYMES, cerrada inicialmente.
- Las cuatro fotografías suministradas sustituyen la estimación inicial de 10 empresas por contador: Jhonatan tiene 10 clientes/12 días; José Fernando Palacios 11/14; Yuranny 10/15; Anderson 2/2. En total, 33 clientes únicos y 43 días asignados. Julio Medina queda pendiente de lista. No se asignan automáticamente las empresas de los supervisores a Estiven o Diana.
- AssignedCompanies resuelve la cartera por identificador de cargo desde pymes-company-assignments.json. Los días conservan la columna de la fotografía y fueron confirmados por el usuario como días asignados a cada empresa; no equivalen a medición de Nivelar. Los identificadores y nombres se transcriben de las imágenes, sin validar denominaciones legales externamente. José Palacio se asocia con la ficha existente de José Fernando Palacios y Yurany Cordoba con Yuranny Córdoba. La cartera se incluye en la impresión de la ficha.
- Se conserva positionLabel y el cargo individual de cada integrante de equipos. Los subdirectores usan su denominación de cargo ya registrada. Para otros nodos sin cargo formal, se muestra la función existente (title) con la nota Cargo formal por confirmar. Se solicitó la nomenclatura faltante; no se inventan cargos a partir de nombres de proyectos.

## Conexión futura con Nivelar

La integración revisada proporciona resúmenes por empleado y día. No existe en esos campos una atribución validada del tiempo a una empresa cliente. company_id en el esquema representa la empresa de la plataforma; no debe reinterpretarse como cliente de la cartera contable.

Para medir eficiencia por empresa se necesita:

1. Cartera real: empresa cliente, contador responsable, vigencia y alcance de la asignación.
2. Atribución del trabajo: empresa, actividad, período y tiempo dedicado, con conciliación frente al tiempo de conexión y tratamiento explícito del tiempo no atribuible.
3. Entregables: trabajo finalizado y validado, cumplimiento de fechas, complejidad, errores y reprocesos.
4. Una línea base comparable para estimar tiempo liberado sin reducir calidad ni cumplimiento. La conexión por sí sola no determina productividad ni disponibilidad.
5. Revisión con el contador y la gerencia para acordar nuevas empresas o auditorías, carga sostenible y condiciones de remuneración. La interfaz no calcula ni promete ingresos y no asigna trabajo automáticamente.

Esta iteración prepara la presentación. No incorpora una nueva integración remota, cambios de permisos ni decisiones automáticas sobre el personal.

## Verificación

- TypeScript: aprobado.
- ESLint de los componentes modificados: aprobado.
- Los bloques se implementan con details/summary nativos sin atributo open, conservando navegación por teclado y estados plegados independientes.
- Compilación de producción: aprobada.

- Verificación de datos: 33 clientes sin duplicados, conteos y sumas coincidentes con las cuatro fotografías, todos los cargos existentes y sin asignaciones inventadas para los analistas o Julio.
- Navegador: seis responsabilidades cerradas al entrar, cartera de Jhonatan desplegada, detalle de 0,5 días visible y revisión visual del ancho móvil de 360 px.

## Archivos de la continuación

- src/data/pymes-company-assignments.json: transcripción de las cuatro listas, número original de fila, nombres y días asignados.
- src/lib/conecta/company-portfolio.ts: resolución por cargo y cálculo de totales de referencia.
- AssignedCompanies y ExecutiveRoleProfile: cartera real por perfil y rótulos de cargo/función.
- OrgExperience: incorpora la cartera a la impresión y mantiene las etiquetas del perfil.
- grupo-ac-org.json: completa únicamente los rótulos de cargo de los dos subdirectores a partir de sus títulos existentes.

Las fotografías no se publican ni se suben al repositorio. La sincronización con Supabase y la atribución real de Nivelar por cliente continúan pendientes. La visibilidad de las listas sigue el acceso actual a la ficha del cargo; no se crean permisos ni se modifica RLS.

## Cargos confirmados posteriormente por el usuario

- Mauricio Olmos: Desarrollador en SADI CDF y Portal Grupo AYC.
- Mauricio Guzmán: Coordinador en MADEXT.
- Jorge Piedrahita: Gerente RESPIRAR-T; también Coordinador en Gestión de Riesgos Laborales. Se completa su nombre en RESPIRAR-T, antes pendiente. No hay fotografía registrada de Jorge en el catálogo ni archivo identificado; se mantienen las iniciales.
- Desarrollo Web: Desarrollador (Juan Sabas Rico conserva su nombre).
- Rodolfo Mesa: Coordinador en SADI CRM.

Las demás fichas sin denominación formal conservan la función registrada y su aviso pendiente; no se extrapolan cargos entre proyectos o personas. Los días se presentan como asignados, sin convertirlos a horas ni asumir una jornada o frecuencia no documentada.
