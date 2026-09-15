"""Import the two user-provided PYMES functional documents without rewriting their content."""
import json
import re
from pathlib import Path
from docx import Document

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'gerente-pymes': 'Documento_Tecnico_Revision_Gerente_PYMES.docx',
    'macroproceso-contable': 'Documento_revision_macroproceso_contable (1).docx',
}

def parse(path, key):
    paragraphs = [p.text.strip() for p in Document(path).paragraphs if p.text.strip()]
    modules = []
    if key == 'gerente-pymes':
        paragraphs = paragraphs[paragraphs.index('5. Arquitectura funcional propuesta') + 1:paragraphs.index('6. Resumen de funciones para validación')]
        modules.append({'code': '01', 'name': 'Dirección del macroproceso contable', 'responsibilities': []})
    else:
        paragraphs = paragraphs[paragraphs.index('01. DESPLIEGUE Y PARAMETRIZACIÓN CONTABLE'):paragraphs.index('9. Formato de revisión y observaciones')]
    current = None
    sub = None
    for text in paragraphs:
        module = re.match(r'^(\d{2})\. (.+)$', text)
        activity = re.match(r'^(\d+\.\d+)\. (.+)$', text)
        subactivity = re.match(r'^(\d+\.\d+\.\d+)\. (.+)$', text)
        if module:
            modules.append({'code': module[1], 'name': module[2], 'responsibilities': []})
        elif activity:
            current = {'code': activity[1], 'name': activity[2], 'subactivities': []}
            modules[-1]['responsibilities'].append(current)
        elif subactivity:
            assert current and subactivity[1].rsplit('.', 1)[0] == current['code']
            sub = {'code': subactivity[1], 'name': subactivity[2], 'tasks': [], 'control': '', 'result': ''}
            current['subactivities'].append(sub)
        elif text.startswith('Tareas: '):
            sub['tasks'] = [task.strip() for task in text.removeprefix('Tareas: ').split('•') if task.strip()]
        elif text.startswith('Control: '):
            sub['control'] = text.removeprefix('Control: ')
        elif text.startswith('Resultado: '):
            sub['result'] = text.removeprefix('Resultado: ')
        else:
            raise ValueError(f'Unrecognized source paragraph: {text}')
    activities = [a for m in modules for a in m['responsibilities']]
    subactivities = [s for a in activities for s in a['subactivities']]
    assert len({a['code'] for a in activities}) == len(activities)
    assert len({s['code'] for s in subactivities}) == len(subactivities)
    assert all(s['tasks'] and s['control'] and s['result'] for s in subactivities)
    print(key, len(modules), 'modules,', len(activities), 'responsibilities,', len(subactivities), 'subactivities,', sum(len(s['tasks']) for s in subactivities), 'tasks')
    return {'source': path.name, 'modules': modules}

if __name__ == '__main__':
    import sys
    source_dir = Path(sys.argv[1])
    profiles = {key: parse(source_dir / source, key) for key, source in SOURCES.items()}
    (ROOT / 'src/data/pymes-functional-profiles.json').write_text(json.dumps(profiles, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
