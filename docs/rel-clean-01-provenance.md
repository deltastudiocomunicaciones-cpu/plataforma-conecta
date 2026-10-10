# REL-CLEAN-01 - Indice de procedencia y preservacion

Baseline inspeccionado: `be187654e006f955c6343db669d2f5ff1f0627b3` (rama `codex/mv-pdf-01`).

Hashes SHA-256 capturados antes del saneamiento: 41 artefactos de `output/pdf` y el formato institucional. Ningun artefacto se mueve, elimina, recomprime o regenera.

Los 41 artefactos fueron incorporados al repositorio en `caec9b3`. El informe y el estado Git describen una entrega anterior: no representan el estado actual del release. Los ejemplos son demostrativos, no actas oficiales.

Los patches describen `e48b710 -> 99a3cbe` (base) y `99a3cbe -> 7c93716` (incremento). El patch temprano del incremento es una evidencia parcial de tres archivos; el final incluye tambien el formato en blanco y su regla Git. Se conservan sin corregir sus espacios de contexto. El patch temprano es parseable (`git apply --numstat`) pero NO aplicable mediante `git apply --cached --check` sobre `99a3cbe`: contiene cabeceras `diff --git /dev/null ...` que Git interpreta como un archivo `dev/null` ausente. REL-CLEAN-01-CLOSE registra la decision del director tecnico: el defecto se acepta exclusivamente como excepcion historica no operativa. No se aprueba su aplicacion ni reutilizacion; no se corrige el patch original. Los patches de base y final si superan la comprobacion contra sus baselines historicos en indices temporales aislados.

Las tres reglas `-diff` de `.gitattributes` cambian unicamente como Git muestra estos archivos de evidencia y evita analizarlos como codigo agregado. No cambian su contenido, no desactivan globalmente whitespace y no afectan `git apply`. La regla `binary` del PDF institucional permanece intacta.

Referencias: `output/pdf/MV-PDF-01-entrega.md` menciona los patches, el snapshot Git y el formato institucional. El nombre del PDF demostrativo en `tests/memory-minute-pdf.test.mjs` es una expectativa de nombre de descarga, no una lectura del archivo archivado. La exportacion genera el documento localmente; no lee estos artefactos.

## Excepcion historica autorizada - REL-CLEAN-01-CLOSE

- Nombre: `MV-PDF-01-increment.diff`.
- Ruta preservada: `output/pdf/MV-PDF-01-increment.diff`.
- Baseline historico: `99a3cbe`.
- Resultado de aplicabilidad: **FAIL**.
- Error reproducido: `dev/null: does not exist in index`.
- Naturaleza: defecto preexistente de formato en cabeceras `diff --git /dev/null ...`.
- Estado: **evidencia historica preservada con defecto de aplicabilidad conocido; no utilizable como patch operativo**.
- SHA-256 original: `926f76953b97e7d96a5243ae5041e37707284001b17f85bcb43b50aa0db2d38b`.
- Prohibicion: no reutilizar para restauraciones o despliegues; no modificar, regenerar, corregir ni eliminar el original.
- Decision: clasificacion autorizada por el director tecnico en REL-CLEAN-01-CLOSE. No constituye aprobacion de aplicacion ni reutilizacion operativa.
- Otros patches: `MV-PDF-01-base-autorizada.diff`, **PASS** sobre `e48b710`; `MV-PDF-01-increment-final.diff`, **PASS** sobre `99a3cbe` (`git apply --cached --check --binary`, indices temporales aislados).

| Nombre | Clasificacion | Ruta preservada | SHA-256 | Baseline de referencia |
|---|---|---|---|---|
| MV-PDF-01-base-autorizada.diff | Patch historico integro | `output/pdf/MV-PDF-01-base-autorizada.diff` | `a9dbf72f8d013f316e1d50401f2a3f6979994e9b3a288289d76b9eae8e1086ed` | e48b710 -> 99a3cbe |
| MV-PDF-01-entrega.md | Informe historico de entrega | `output/pdf/MV-PDF-01-entrega.md` | `912c9afda1d089b332d71f168b77c655ef1061e09ac1366e134959a3aa8f1b65` | 99a3cbe / 7c93716 |
| MV-PDF-01-git-final.txt | Snapshot Git historico | `output/pdf/MV-PDF-01-git-final.txt` | `a27c307194dedbd5caf03e21d329606b8f82241f48831fa70d18b5b9b7519cc9` | 7c93716; no describe HEAD actual |
| MV-PDF-01-increment-final.diff | Patch historico integro | `output/pdf/MV-PDF-01-increment-final.diff` | `1a0fd37e30003e70f123dfc8b59c05156f2d8d7ea4ddeb1b11fca1f92e3b200c` | 99a3cbe -> 7c93716 |
| MV-PDF-01-increment.diff | Evidencia historica con defecto conocido; NO OPERATIVA | `output/pdf/MV-PDF-01-increment.diff` | `926f76953b97e7d96a5243ae5041e37707284001b17f85bcb43b50aa0db2d38b` | 99a3cbe -> 7c93716 |
| acta-blanca-1.png | QA visual del formato institucional | `output/pdf/acta-blanca-1.png` | `938cd8acdca4106de54ff2c2929e7375d1cf1561a6c39109f1686c2a7c669af4` | 7c93716 |
| acta-blanca-2.png | QA visual del formato institucional | `output/pdf/acta-blanca-2.png` | `8a374390ac8af6ed09d9295ff32d261520ea44de48c4058db3585d5f1f4f4fa0` | 7c93716 |
| acta-blanca-3.png | QA visual del formato institucional | `output/pdf/acta-blanca-3.png` | `cd40f701ee411aded7b3d70d0a4e10952a4eca14953ebfdff6f79f87349eb6d8` | 7c93716 |
| acta-blanca-4.png | QA visual del formato institucional | `output/pdf/acta-blanca-4.png` | `1b341e1a5ddfa1a1095eca630c01aebeeeaaf7a37f670887470aae4747749025` | 7c93716 |
| acta-blanca-5.png | QA visual del formato institucional | `output/pdf/acta-blanca-5.png` | `c9c0ce68e2dbcf811e51f0168140d52bd13cb9fa96ca44bf4e4c77b919ccaf15` | 7c93716 |
| browser-acta-borrador.pdf | QA de descarga desde interfaz | `output/pdf/browser-acta-borrador.pdf` | `775e31d9ac6e2989bd0d0aae11da3b4fec642347f29c2a0cf4c178923ffa4a53` | MV-PDF-01 / 7c93716 |
| browser-acta-revision.pdf | QA de descarga desde interfaz | `output/pdf/browser-acta-revision.pdf` | `5e57f0f1d63122e64f0351b83543757a158b438e0b694842b4c9768e1d3e3ab3` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-002-2026-10-04-page-1.png | QA visual / demostracion | `output/pdf/conecta-acta-demo-002-2026-10-04-page-1.png` | `8da80efe007a90e8cc16564cfd8c31a8bd31fb3b00394b42f26e542b80b4cac1` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-002-2026-10-04-page-2.png | QA visual / demostracion | `output/pdf/conecta-acta-demo-002-2026-10-04-page-2.png` | `7b0d944b452b08a3a482cade1b159444f036d0a64967c6a3a9e7b9c460f64553` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-002-2026-10-04-page-3.png | QA visual / demostracion | `output/pdf/conecta-acta-demo-002-2026-10-04-page-3.png` | `cc46737cf4a119e14bc7fafb593ec26b11d21a23d75254210ab2d37bbdb27276` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-002-2026-10-04.pdf | QA visual / demostracion | `output/pdf/conecta-acta-demo-002-2026-10-04.pdf` | `12026ffa39a62535c80cea862a63d41dbce184879fdffa546ebc6f5ea5ff0bc6` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-1.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-1.png` | `11f0fb4d7394dbf0f02dd10b6c396e6587f47b2d15cf6d6e88e4f85ddefc60f1` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-2.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-2.png` | `d04a8bb0ef6d4d67ba773d821f99c027d71d837bd421e1c0acb9401c2391c78e` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-3.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-3.png` | `91590d893b14c0cde5ccff664ebe6accd5702f2841138de65f396b70d29dab0e` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-4.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-4.png` | `2c0f0326d8717e05eb91fe1772587055ec447a7b493c286685ea57e6c9a42685` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-5.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-5.png` | `624ddbd59837771c6916baf6c93c758e5381c59aea3951d44128c00f76073c1f` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-6.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-6.png` | `086a1f8344f48ee506dfd7abad213db6688caed453f5e87c124b973c6e326aec` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-7.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-7.png` | `378de9bd9d327896e2f3360132f8ff196adaa1ede4e2856cb04025d1785df5fe` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-8.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-8.png` | `31cbaa3aff8797fa85362ffc25a06990ac4c9e9253ebfb5b6d9820091329de50` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos-page-9.png | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos-page-9.png` | `7564125e66ab9defcd75bc263c1d96349320bd80c5aee8979f4c1213151b760e` | MV-PDF-01 / 7c93716 |
| conecta-acta-demo-textos-largos.pdf | QA de estres / paginacion | `output/pdf/conecta-acta-demo-textos-largos.pdf` | `5edc45ab64bf78d6ab0f8a0f462c9f9305a0246cabf7fb61faa438bcaa98a1df` | MV-PDF-01 / 7c93716 |
| mv-pdf-01-browser.png | QA visual / demostracion | `output/pdf/mv-pdf-01-browser.png` | `438278a681a4bde6823aaa541f2e7d2d15fcf47cd3dcbad447116b618414c41c` | MV-PDF-01 / 7c93716 |
| mv-pdf-01-long-contact.png | QA de estres / paginacion | `output/pdf/mv-pdf-01-long-contact.png` | `e752011aefe9495f002a7fb6e5ba6381898774ad442f6066287cfd6beb676851` | MV-PDF-01 / 7c93716 |
| verified-acta-1.png | QA visual / demostracion | `output/pdf/verified-acta-1.png` | `cae3bc2c98823a74891489a6a7e7260eafeefe737b92ed4fac43714db08d9fd2` | MV-PDF-01 / 7c93716 |
| verified-acta-2.png | QA visual / demostracion | `output/pdf/verified-acta-2.png` | `14f577360d6e4154d5016bebbed6e030124721c96671eaf76eac8a7a149070e5` | MV-PDF-01 / 7c93716 |
| verified-acta-3.png | QA visual / demostracion | `output/pdf/verified-acta-3.png` | `6747f7839bbf3bf23b63917e127653e3ccbfaa6e09be3dac682f2a1ec44e00dd` | MV-PDF-01 / 7c93716 |
| verified-browser.png | QA visual / demostracion | `output/pdf/verified-browser.png` | `c4822ce415441c9733d0d1f9171072f7662dec09f7d2b480c6979f9249e1300e` | MV-PDF-01 / 7c93716 |
| verified-long-1.png | QA de estres / paginacion | `output/pdf/verified-long-1.png` | `20f4804ff4caa671f191fd4059f227453ff07af193a22897f75283be6fdf0b44` | MV-PDF-01 / 7c93716 |
| verified-long-2.png | QA de estres / paginacion | `output/pdf/verified-long-2.png` | `533244620a4be253da0443765279f10478fddc25d6d9eb9a98a4d6de2d36b13b` | MV-PDF-01 / 7c93716 |
| verified-long-3.png | QA de estres / paginacion | `output/pdf/verified-long-3.png` | `9b26a0c9e4bdb935d3cbe8b0f1a4c529b32baa249d74246f0a2a26bef4a73afc` | MV-PDF-01 / 7c93716 |
| verified-long-4.png | QA de estres / paginacion | `output/pdf/verified-long-4.png` | `5f602725fb673b9de3e16dac79ae48da415290d4f683555c0c4b6f1c97e0c88c` | MV-PDF-01 / 7c93716 |
| verified-long-5.png | QA de estres / paginacion | `output/pdf/verified-long-5.png` | `8c6c9d7019543958ca936572d903434145263743e8a0bb64b01d61d2c650a7a0` | MV-PDF-01 / 7c93716 |
| verified-long-6.png | QA de estres / paginacion | `output/pdf/verified-long-6.png` | `02b8aa3fc7cb47d38e89e07c13d47675021432defb86e3a4608842054c93c1fa` | MV-PDF-01 / 7c93716 |
| verified-long-7.png | QA de estres / paginacion | `output/pdf/verified-long-7.png` | `f68d32b39a173037ecc583a76a707369993cdb3891f0fdee39b91ad787099377` | MV-PDF-01 / 7c93716 |
| verified-long-8.png | QA de estres / paginacion | `output/pdf/verified-long-8.png` | `9db24a5ec1d588e6b6382c69811d20b508afbb6b7672a6cf1f5af4b67d43a468` | MV-PDF-01 / 7c93716 |
| verified-long-9.png | QA de estres / paginacion | `output/pdf/verified-long-9.png` | `a004e21e9b5558d797dbfaf5ace2fe794d84520d59d75e3edddbda2f1cc002cc` | MV-PDF-01 / 7c93716 |
| conecta-acta-v1-en-blanco.pdf | Entregable institucional en blanco | `docs/templates/conecta-acta-v1-en-blanco.pdf` | `21f939af6ab8c7cb870b9afe4487389a55e425a1f9d9691180a9475bdeb2a5ed` | 7c93716; preservado en be187654 |
