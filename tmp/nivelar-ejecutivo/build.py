from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from copy import deepcopy
from lxml import etree as E
ref=Path('C:/Users/juans/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-system-design/assets/reference.docx')
out=Path('output/Propuesta_ejecutiva_integracion_Conecta_Nivelar.docx');out.parent.mkdir(exist_ok=True)
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
w=lambda x:'{'+ns['w']+'}'+x
with ZipFile(ref) as z:
 root=E.fromstring(z.read('word/document.xml'));body=root.find('w:body',ns); original=list(body)
 pbase=deepcopy(original[24]);hbase=deepcopy(original[23]);tbase=deepcopy(original[28]);sect=deepcopy(body.find('w:sectPr',ns))
 def text(el,value):
  nodes=el.xpath('.//w:t',namespaces=ns)
  if nodes:
   nodes[0].text=value
   for n in nodes[1:]:n.text=''
  else:
   r=E.SubElement(el,w('r'));E.SubElement(r,w('t')).text=value
 def para(value,heading=False):
  p=deepcopy(hbase if heading else pbase);text(p,value)
  for el in p.xpath('.//w:pageBreakBefore',namespaces=ns):el.getparent().remove(el)
  body.append(p)
 def br():
  p=E.SubElement(body,w('p'));r=E.SubElement(p,w('r'));b=E.SubElement(r,w('br'));b.set(w('type'),'page')
 def table(headers,rows):
  t=deepcopy(tbase);rs=t.findall('w:tr',ns);head=deepcopy(rs[0]);row=deepcopy(rs[1])
  for r in rs:t.remove(r)
  for vals,base in [(headers,head)]+[(r,row) for r in rows]:
   tr=deepcopy(base)
   for cell,val in zip(tr.findall('w:tc',ns),vals):text(cell,val)
   t.append(tr)
  body.append(t)
 for el in list(body):body.remove(el)
 for el in original[:23]:body.append(deepcopy(el))
 cover=list(body)
 text(cover[8],'Plataforma Conecta')
 text(cover[9],'Integración con Nivelar')
 for cell,value in zip(cover[20].xpath('./w:tr/w:tc',namespaces=ns),['ESTADO\nPropuesta para evaluación','','PROPONE\nPlataforma Conecta','','FECHA\n15 de septiembre de 2026']):text(cell,value)
 for row,vals in zip(cover[22].findall('w:tr',ns),[['Dirigido a','Asesor e ingeniería de Nivelar'],['Propósito','Acordar datos, alcance y viabilidad de integración'],['Proceso','Macroproceso contable de PYMES'],['Resultado esperado','Definición técnica y plan de piloto conjunto']]):
  for c,v in zip(row.findall('w:tc',ns),vals):text(c,v)
 br()
 para('1  Objetivo ejecutivo',True)
 para('Proponemos integrar Nivelar con Plataforma Conecta para relacionar el tiempo de trabajo de los funcionarios con las empresas atendidas, las responsabilidades contables y los resultados validados. Buscamos mejorar la planeación, identificar reprocesos y evaluar capacidad disponible para asumir nuevas empresas o actividades de auditoría.')
 para('Solicitamos una sesión de descubrimiento con el asesor y el equipo técnico de Nivelar para confirmar las capacidades de captura, la disponibilidad de datos y el mecanismo de intercambio. La conexión a aplicaciones, por sí sola, no demuestra la finalización ni la calidad del trabajo.')
 para('2  Contexto organizacional',True)
 para('Conecta estructura el trabajo en tres niveles: Gerente PYMES, Contador Auditor y Analista Integrador. Las fichas organizan responsabilidades, subactividades, tareas, controles y resultados. También contamos con una relación inicial de 33 empresas o clientes distribuidos en cuatro carteras, con días asignados por empresa.')
 para('El macroproceso comprende seis frentes: despliegue y parametrización; captura y procesamiento; aseguramiento y control; gestión tributaria; información financiera; y gestión documental y archivo.')
 para('3  Responsabilidad de cada plataforma',True)
 table(['Plataforma','Aporte propuesto'],[
 ('Conecta','Identidad y cargo, empresas asignadas, planificación, estructura funcional, entregables, controles y validación del trabajo.'),
 ('Nivelar','Registros de conexión y actividad, intervalos y categorías disponibles, con su definición y cobertura confirmadas por el proveedor.'),
 ('Integración conjunta','Vinculación por identificadores, atribución del tiempo a empresa y responsabilidad, tratamiento de faltantes y trazabilidad de correcciones.')])
 para('Conecta dispone de una base de integración para consultar empleados y resúmenes diarios de Nivelar. Deben verificarse su correspondencia con la API vigente y su operación real antes de activar el piloto.')
 br()
 para('4  Información que necesitamos confirmar',True)
 para('Solicitamos documentación técnica, un diccionario de campos y una muestra anonimizada de una semana. Para cada dato necesitamos conocer significado, unidad, periodicidad, disponibilidad y tratamiento de registros incompletos.')
 table(['Tema','Pregunta para Nivelar'],[
 ('Identidad','¿Existe un identificador estable por funcionario para vincularlo con Conecta, sin depender exclusivamente del nombre o correo?'),
 ('Tiempo y cobertura','¿Se entregan totales diarios o intervalos con inicio, fin y duración? ¿Qué zona horaria y unidades se utilizan? ¿Cómo se detectan períodos sin captura?'),
 ('Empresa y actividad','¿Puede Nivelar registrar o recibir un código de empresa cliente, proyecto y responsabilidad? ¿Ofrece etiquetas de trabajo o alguna forma de asociarlas?'),
 ('Clasificaciones','¿Cómo define productivo, improductivo, neutral e inactividad? ¿Las categorías se superponen y las reglas varían según el cargo?'),
 ('Trabajo no capturado','¿Cómo contempla reuniones, llamadas, visitas y trabajo fuera del computador? ¿Cómo evita duplicar tiempo entre dispositivos?'),
 ('Historial y correcciones','¿Cada registro tiene identificador y fecha de actualización? ¿Cómo se consultan correcciones, duplicados, faltantes e históricos?'),
 ('Acceso técnico','¿Qué autenticación, permisos, límites, paginación y frecuencia de actualización ofrece la API? ¿Permite consultas periódicas o notificaciones automáticas?')])
 para('Pregunta decisiva',True)
 para('¿Nivelar identifica para qué empresa trabaja el funcionario o únicamente qué aplicación utiliza? Esta respuesta determina cómo construiremos la atribución por cliente.')
 para('Si Nivelar no identifica la empresa, proponemos que Conecta registre la empresa y responsabilidad seleccionadas por el funcionario y concilie esa información con los intervalos disponibles. El tiempo no atribuible permanecerá identificado como tal; no se repartirá automáticamente entre clientes.')
 br()
 para('5  Modelo de medición',True)
 para('La relación funcional propuesta es: funcionario, empresa, período, responsabilidad, subactividad o tarea, tiempo dedicado y resultado validado. Para reducir la carga de registro, el piloto comenzará por empresa y responsabilidad.')
 para('Evaluaremos conjuntamente tiempo asignado frente a dedicado, cumplimiento de entregables y fechas, calidad de las revisiones, devoluciones y reprocesos, considerando el volumen y la complejidad de cada empresa. Los controles deberán registrar responsable de revisión, fecha, evidencia y aceptación o devolución del resultado.')
 para('Los días asignados son una referencia de planificación. Antes de convertirlos en horas se acordarán el período de asignación y la duración de la jornada. La capacidad adicional se evaluará con el funcionario y la gerencia; nuevas cargas y condiciones de ingreso requerirán acuerdo, sin decisiones automáticas basadas únicamente en conexión.')
 para('6  Piloto propuesto',True)
 table(['Etapa','Entregable y criterio de avance'],[
 ('Definición conjunta','Confirmar campos, identificadores, atribución por empresa, reglas de clasificación, responsables y mecanismo de acceso.'),
 ('Preparación','Seleccionar un Contador Auditor y dos empresas; fijar un ciclo contable completo, días asignados, responsabilidades y entregables esperados.'),
 ('Validación','Conciliar registros recibidos con Nivelar, evitar duplicados, explicar tiempo sin asignar y contrastar dedicación con entregables aprobados.'),
 ('Cierre y decisión','Revisar resultados con el contador y la gerencia. Acordar ajustes y decidir si existe evidencia suficiente para ampliar el piloto.')])
 para('7  Acuerdos solicitados a Nivelar',True)
 para('Esperamos recibir la documentación de la API y el diccionario de datos; una muestra anonimizada; confirmación de la capacidad de identificar empresa y actividad; requisitos y condiciones de acceso; y un contacto técnico para acordar el piloto, sus tiempos y los costos que correspondan.')
 para('El intercambio se realizará desde el servidor de Conecta, con credenciales protegidas y acceso por rol. Antes del piloto acordaremos información al funcionario, datos mínimos necesarios, retención y trazabilidad. No requerimos capturas de pantalla ni contenido de documentos para esta primera etapa.')
 para('Decisión esperada: confirmar la viabilidad de vincular tiempo y trabajo contable, definir las brechas y acordar el alcance del piloto antes de una integración general.')
 body.append(sect)
 with ZipFile(out,'w',ZIP_DEFLATED) as dest:
  for item in z.infolist():dest.writestr(item, E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True) if item.filename=='word/document.xml' else z.read(item.filename))
print(out.resolve())
