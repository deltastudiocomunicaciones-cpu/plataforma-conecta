# LAB-GATE-B2C — Docker sailor socket forensics

## Resultado

**LAB-GATE-B2C = INCONCLUSIVE. Clasificación G — UNKNOWN para causa raíz.** El punto de fallo es verificable, pero no está demostrado que sea un lock, una ACL, antivirus o corrupción. No se ejecutó recuperación.

## Procesos y WSL

Consulta de lectura en el host, sin elevación administrativa: no aparecen Docker Desktop, com.docker.backend, com.docker.build, docker, vmmem ni sailor. Aparece wslservice PID 8028, ruta no observable; esto no equivale a una distribución iniciada. `wsl --list --verbose` muestra únicamente docker-desktop, Stopped, versión 2.

No se finalizaron procesos ni se contactó al daemon. La ausencia actual de procesos Docker no demuestra ausencia de handles de otros componentes.

## Socket y directorio

Ruta: `C:\Users\juans\AppData\Local\Docker\run\sailor-ingest.sock`.

| Campo | Observación |
|---|---|
| Entrada original | Presente mediante enumeración del directorio |
| `.stale` | No apareció en la enumeración `sailor-ingest.sock*` |
| Tamaño | 0 bytes |
| Atributos | 1056 = Archive + ReparsePoint |
| CreationTimeUtc | 2026-09-20T06:39:46.8141472Z |
| LastWriteTimeUtc | 2026-09-20T06:39:46.8141472Z |
| LinkType | null; no demuestra ausencia de reparse point |
| Tag | Antecedente aprobado AF_UNIX 0x80000023; no reconsultado mediante adaptador nativo en esta fase |
| Owner / ACL del socket | No observables: Get-Acl devuelve error 1920 |

Las fechas coinciden con el antecedente histórico. No se revalidó File ID; no se afirma identidad física solo por timestamps.

La ACL del directorio `run` es legible: propietario usuario local; entradas heredadas Allow para usuario, SYSTEM, Administradores y principales adicionales del entorno. No se observan entradas Deny en esa DACL. Usuario/SYSTEM/Administradores tienen FullControl en el directorio. Esto no constituye una evaluación de acceso efectivo al socket, cuya DACL no pudo leerse.

Volumen C: NTFS; Get-Volume reporta Healthy. No se ejecutó prueba de integridad del filesystem; Healthy no excluye anomalías de un objeto particular. Error 1920 no equivale por sí solo a una denegación ACL.

## Handles

`handle.exe`, `handle64.exe`, `procexp.exe` y `procexp64.exe` no fueron resolubles por Get-Command. No se realizó búsqueda exhaustiva del disco ni instalación. No se ejecutó una nueva inspección interactiva de Monitor de recursos.

**HANDLE_OWNER = NOT OBSERVABLE.** Las búsquedas manuales normal/elevada sin coincidencias son antecedentes, no una medición actual ni prueba absoluta de ausencia de handles.

## Correlación del intento actual

Fuente: log host existente `com.docker.backend.exe.log`. Timestamps UTC.

- 2026-10-04 01:51:55.4074977: backend registra crash al inicializar Ingest; intenta rename del socket a `.stale`; resultado `The file cannot be accessed by the system`.
- 01:51:55.4100481: backend comunica el mismo error al usuario.
- 01:52:29.3069040: ErrorReportAPI entrega a Docker Desktop 4.91.0 el mensaje `An unexpected error occurred`, con acciones Quit y Reset to factory defaults. Ninguna acción fue ejecutada por este diagnóstico.

El fallo actual de Get-Acl con 1920 demuestra que también una consulta de seguridad del objeto falla. No demuestra por qué falla.

## Señales de seguridad

Procesos observados: AVGSvc PID 4340, avgToolsSvc PID 4800 (rutas no observables), AVGUI PIDs 1920, 17484, 20592, 22808 con ruta `C:\Program Files\AVG\Antivirus\AVGUI.exe`. No aparecieron procesos coincidentes con 360 o MsMpEng en la selección realizada.

La búsqueda de metadata de reportes recientes en la ruta candidata AVG no produjo resultados; no se interpreta como cobertura completa de sus logs. La consulta de Windows Defender/Operational desde 03/10/2026 20:40 local devolvió ausencia de eventos para el intervalo. No se inspeccionaron contenidos ajenos al incidente.

**SECURITY_INTERFERENCE = NOT DEMONSTRATED.** La presencia de AVG no establece causalidad.

## Clasificación y reparación mínima candidata

G — UNKNOWN. No se cumplen condiciones para A (unlocked no demostrado), B (sin propietario de handle), C (sin ACL del objeto), D (sin evento correlacionado), E (sin prueba de corrupción) ni causa F (el fallo interno observado no explica el origen del objeto inaccesible).

No hay reparación demostrada. La opción mínima candidata, sujeta a otro gate, sería una única retirada nativa mediante DeleteFileW de la entrada exacta, después de confirmar ausencia de procesos, identidad nativa y vigencia del respaldo, y de reconciliar el resultado de cualquier intento anterior. No se debe repetir un intento ya consumido sin autorización expresa. Esta propuesta no afirma que DeleteFileW vaya a superar el error ni que Docker recomiende oficialmente la operación.

| Aspecto | Condición de la candidata, no ejecutada |
|---|---|
| Mutación | Eliminar exclusivamente la entrada residual, nunca el directorio run |
| Recurso | sailor-ingest.sock exacto |
| Administrador | No propuesto de entrada; si es requerido, detenerse |
| Reversibilidad | No hay rollback exacto del socket eliminado; Docker podría recrearlo, sin garantía |
| Riesgo LAB-1 | No toca directamente discos/volúmenes; un futuro arranque puede reactivar contenedores |
| Riesgo Docker | Pérdida de evidencia del objeto y persistencia del fallo; posible conflicto si un consumidor no observado lo utiliza |
| Aborto/rollback | Ante fallo, detenerse sin fallback; ante éxito no iniciar automáticamente Docker. No restaurar VHDX como rollback automático de un socket host, pues son ámbitos distintos |

Si se exige reversibilidad exacta o sigue siendo incierto el historial de eliminación, la recomendación es mantener el objeto y solicitar orientación de soporte con esta evidencia; no sustituirlo por cambios ACL, ownership, reset o reinstalación.

## Preservación y cierre

- LAB-1 containers / volumes / networks / images modified por esta investigación: 0 / 0 / 0 / 0. No se verificó su inventario interno.
- Docker restarted: NO.
- Socket modified: NO.
- Firewall modified: NO; regla temporal no intervenida.
- LAB-1 modified: NO.
- SQL executed: NO.
- Supabase executed: NO.
- Único archivo creado: este informe. Ningún código, SQL o configuración modificado.

**STOP. Esperar autorización del Director. No ejecutar la candidata de reparación.**
