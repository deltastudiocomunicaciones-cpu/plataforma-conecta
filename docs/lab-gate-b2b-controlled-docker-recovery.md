# LAB-GATE-B2B — Controlled Docker Start & LAB-1 Containment

## Executive Result

**LAB-GATE-B2B = BLOCKED_DOCKER.** Se solicitó una sola vez el inicio de Docker Desktop. El backend falló durante la inicialización de Ingest; el daemon no respondió. No se ejecutó contención, reparación ni eliminación.

## Baseline

Fecha: 2026-10-03, America/Bogota. Branch `main`, HEAD `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`. Estado Git inicial: 10 archivos registrados modificados y 20 entradas no registradas preexistentes. La única incorporación de este gate es este informe.

Preflight en el host: sin procesos Docker Desktop/backend observados; `docker-desktop = Stopped`, WSL 2; cero listeners en 55431, 55432, 55433, 55434 y 55437.

La regla `CONecta-LAB1-Temporary-Containment` y sus filtros se aceptaron como evidencia administrativa aportada por el operador. No se modificó ni se certificó nuevamente su eficacia mediante una prueba externa.

## Docker Startup

Se ejecutó una sola invocación de `Start-Process` sobre `C:\Users\juans\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe`, con `-WindowStyle Hidden`.

Se observaron posteriormente procesos Docker Desktop y com.docker.backend. Dos consultas `docker --context desktop-linux version --format '{{json .}}'` devolvieron cliente disponible, Server=null y endpoint ausente: `npipe:////./pipe/dockerDesktopLinuxEngine`.

El log host registra:

```text
2026-10-04T01:51:24.399550200Z — backend cancelling with error
starting services: initializing Ingest server: listening on unix://C:/Users/juans/AppData/Local/Docker/run/sailor-ingest.sock: rename C:/Users/juans/AppData/Local/Docker/run/sailor-ingest.sock C:/Users/juans/AppData/Local/Docker/run/sailor-ingest.sock.stale: The file cannot be accessed by the system.
2026-10-04T01:51:55.407497700Z — backend crashed, dumping error to file and reporting to user
```

Esas horas equivalen aproximadamente a 20:51:24 y 20:51:55 del 03/10/2026 en Bogotá. También aparecen fallos de consultas WSL internas del backend y un timeout posterior; no se diagnosticaron ni corrigieron.

No se inspeccionó ni manipuló el socket. El mensaje coincide con el patrón histórico; no prueba por sí mismo una causa raíz ni la identidad física actual del objeto. No se volvió a iniciar Docker, ni se cerraron forzosamente sus procesos.

## Docker Version

Cliente observado: 29.8.0, API 1.56, windows/amd64, contexto desktop-linux. **No es la versión de Docker Desktop ni la del servidor.** Versión servidor no disponible. Antecedente Docker Desktop: 4.91.0, no revalidado en esta intervención.

## Container Inventory

NOT OBSERVED: daemon no disponible. No se ejecutaron inventarios contra un motor operativo.

## LAB-1 Identification

No se clasificaron contenedores actuales como LAB1_CONFIRMED, LAB1_POSSIBLE o NON_LAB1. Cantidades actuales desconocidas. El antecedente de 12 contenedores no se presenta como inventario actual.

## Initial Runtime State

Antes del inicio: Docker cerrado y distribución detenida. Después: procesos presentes, endpoint no disponible; backend registra crash. No puede afirmarse que LAB-1 se reactivara ni que permaneciera detenido.

## Containment Actions

Ninguna. `docker stop` no ejecutado porque no pudo obtenerse identidad ni estado actual de contenedores.

## Restart Policies

NOT OBSERVED. Ninguna política consultada mediante inspect ni modificada.

## Port Bindings

Bindings actuales no observados. Antecedente: 55431/55432/55433/55434/55437 publicados en 0.0.0.0 y ::. El firewall no transforma esos bindings en loopback.

## Host Listeners Before

Cero listeners en los cinco puertos históricos.

## Host Listeners After

Cero listeners en los cinco puertos en la consulta posterior al inicio, antes de leer el log de fallo. No hubo fase posterior de contención ni monitorización continua; no se afirma ausencia durante todo el intervalo ni se extrapola a puertos no consultados.

## Networks

Inventario actual no disponible. Ninguna red creada, eliminada ni modificada por comandos de esta intervención.

## Volumes

Inventario actual no disponible. Ningún volumen montado, leído internamente, eliminado o modificado deliberadamente.

## Images

Inventario actual no disponible. No se descargaron ni eliminaron imágenes mediante comandos de esta intervención.

## Preservation Evidence

No se ejecutaron operaciones destructivas. No puede certificarse la presencia actual de contenedores, imágenes, volúmenes y redes sin daemon. El arranque sí generó actividad propia de Docker y logs; no se afirma ausencia absoluta de escrituras internas del producto.

## Residual Risks

El fallo Ingest impide recuperar el plano de control. El estado actual de LAB-1 y sus restart policies sigue pendiente. Pueden permanecer procesos o una interfaz de error de Docker; no se ordenó su cierre. La regla temporal del operador no fue retirada. No se autoriza implícitamente ninguna reparación con este resultado.

## Gate Matrix

| Criterio | Resultado |
|---|---|
| Docker inició correctamente | NO: backend crash |
| Daemon inspeccionado | NO |
| Contenedores clasificados | NO |
| LAB1_CONFIRMED identificado | NO |
| Activos detenidos | NOT EXECUTED |
| LAB1_RUNNING_AT_END = 0 | NOT VERIFIED |
| LAB1_LISTENERS_AT_END = 0 | Última muestra de cinco puertos: 0; sin contención |
| Volúmenes/redes/contenedores/imágenes presentes | NOT VERIFIED |
| Ninguna operación destructiva | Sí |

## Scope Closure

- Initial HEAD: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`.
- Final HEAD: `70cbb5322c9b9920bf5bd97dc0865b2aa1dc325f`, comprobado. Git conserva el trabajo preexistente; la única entrada adicional es este informe.
- Docker started: inicio solicitado una vez; procesos observados.
- Docker healthy: NO.
- Docker version: cliente 29.8.0; servidor no observado.
- Containers observed / initially running: NOT OBSERVED.
- LAB1 confirmed / possible / Unknown: sin clasificación actual; no equivalen a cero recursos.
- LAB1 initially running / running at end: NOT VERIFIED.
- LAB1 stopped: 0 por esta intervención.
- LAB1 restart policies: NOT OBSERVED.
- LAB1 bindings: históricos externos; efectivos actuales no observados.
- Listeners before Docker / after attempted startup: 0 / 0 en los cinco puertos.
- Listeners after containment: NOT APPLICABLE; no hubo contención.
- Containers / Volumes / Networks / Images deleted: 0 / 0 / 0 / 0.
- SQL / Supabase / Migrations / Fixtures: ninguno.
- Remote CONECTA connections: ninguna.
- LAB-GATE-B2B: **BLOCKED_DOCKER**.

**STOP. No crear LAB2, ejecutar SQL, reanudar MV-F3-02R ni reparar Docker. Esperar autorización del Director.**
