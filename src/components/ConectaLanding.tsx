import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Layers,
  Mail,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const accessSteps = [
  ["Acceso", "Correo corporativo, clave personal y permisos según rol."],
  ["Mapa vivo", "Cargos, responsables, perfiles, informes y evidencias conectadas."],
  ["Alertas", "Cada informe genera notificación, acuse, revisión y seguimiento."],
  ["Decisión", "Dirección y gerencias leen el sistema sin perder foco operativo."],
];

const offerings = [
  ["Mapa Vivo de Desempeño", "Organigrama interactivo, perfiles de cargo, informes, evidencias y dashboard directivo."],
  ["Charlas Conecta", "Conversaciones empresariales sobre liderazgo, cultura, estructura y evolución organizacional."],
  ["Diagnóstico Conecta", "Lectura inicial del sistema para identificar tensiones, bloqueos, prioridades y oportunidades."],
  ["Acompañamiento", "Ruta de implementación, adopción interna, informes y reuniones de seguimiento."],
];

const promoCards = [
  {
    image: "/fotos/cultura-conecta-encuentros-ejecutivos.png",
    text: "Sesiones privadas para conversar sobre estructura, liderazgo, cultura y decisiones críticas.",
    title: "Encuentros ejecutivos",
  },
  {
    image: "/fotos/cultura-conecta-salas-experiencias.png",
    text: "Espacios preparados para juntas, talleres, entrevistas, comités y conversaciones estratégicas.",
    title: "Salas y experiencias",
  },
  {
    image: "/fotos/cultura-conecta-eventos.png",
    text: "Charlas, conversatorios y experiencias de formación para equipos que necesitan moverse con claridad.",
    title: "Eventos Conecta",
  },
];

const venueCards = [
  {
    image: "/fotos/cultura-conecta-auditorio.webp",
    text: "Charlas, formación empresarial, presentaciones y encuentros de cultura.",
    title: "Auditorio Conecta",
  },
  {
    image: "/fotos/cultura-conecta-sala-audiovisual.png",
    text: "Podcast, entrevistas, contenido corporativo y conversaciones grabadas.",
    title: "Sala audiovisual",
  },
  {
    image: "/fotos/cultura-conecta-sala-juntas.png",
    text: "Reuniones directivas, comités gerenciales y sesiones de decisión.",
    title: "Sala de juntas",
  },
];

export function ConectaLanding() {
  return (
    <main className="conecta-public">
      <header className="conecta-public__nav">
        <Link className="conecta-public__brand" href="/">
          <Image alt="Cultura Conecta" height={1165} priority src="/brand/cultura-conecta-isotipo-3d.png" width={1350} />
          <span>Plataforma Conecta</span>
        </Link>
        <nav aria-label="Navegación pública Plataforma Conecta">
          <a href="#producto">Producto</a>
          <a href="#servicios">Servicios</a>
          <a href="#experiencias">Experiencias</a>
          <a href="#metodo">Método</a>
          <Link href="/acceso">Ingresar</Link>
        </nav>
      </header>

      <section className="conecta-public__hero">
        <div className="conecta-public__hero-copy">
          <p className="eyebrow">Cultura Conecta | Plataforma organizacional</p>
          <h1>La empresa como sistema vivo, visible y gobernable</h1>
          <p>
            Plataforma Conecta convierte cargos, informes, evidencias, alertas y decisiones en una red interna de desempeño para comprender cómo avanza una organización.
          </p>
          <div className="conecta-public__actions">
            <Link className="conecta-button conecta-button--primary" href="/acceso">
              Ingresar al prototipo
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <a className="conecta-button conecta-button--ghost" href="#servicios">
              Ver servicios
            </a>
          </div>
        </div>
        <div className="conecta-public__hero-card" aria-label="Resumen visual Plataforma Conecta">
          <Image alt="" fill priority sizes="(max-width: 900px) 100vw, 1320px" src="/method/metodo-conecta-nevado.png" />
          <div>
            <span>Mapa Vivo de Desempeño</span>
            <strong>Organigrama + informes + alertas + decisiones</strong>
            <p>No evaluamos personas aisladas. Leemos el sistema que permite o bloquea su desempeño.</p>
          </div>
        </div>
      </section>

      <section className="conecta-public__promo" id="experiencias">
        <div className="conecta-public__section-head conecta-public__section-head--split">
          <div>
            <p className="eyebrow">Vitrina Conecta</p>
            <h2>Servicios, espacios y conversaciones para mover la organización.</h2>
          </div>
          <p>
            Esta zona funcionará como escaparate comercial: aquí podremos publicar eventos, salas disponibles,
            programas, charlas y piezas promocionales de Cultura Conecta.
          </p>
        </div>
        <div className="conecta-public__promo-grid">
          {promoCards.map((card, index) => (
            <article key={card.title}>
              <Image alt="" fill sizes="(max-width: 900px) 100vw, 420px" src={card.image} />
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <a href="https://www.grupoayc.co/cultura-conecta" rel="noreferrer" target="_blank">Solicitar información <ArrowRight aria-hidden="true" size={16} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="conecta-public__access" id="producto">
        <article>
          <ShieldCheck aria-hidden="true" size={22} />
          <span>Arquitectura de acceso</span>
          <h2>Primero se entra. Luego el sistema muestra solo lo permitido.</h2>
          <p>
            La experiencia privada debe operar con correo, clave personal, rol, empresa, área y cargo. La seguridad real vive en backend; la interfaz solo revela el alcance autorizado.
          </p>
        </article>
        <div className="conecta-public__login-card">
          <div className="conecta-public__login-head">
            <KeyRound aria-hidden="true" size={20} />
            <strong>Acceso privado</strong>
          </div>
          <label>
            <span>Correo corporativo</span>
            <div><Mail aria-hidden="true" size={16} /> nombre@empresa.com</div>
          </label>
          <label>
            <span>Clave personal</span>
            <div><KeyRound aria-hidden="true" size={16} /> ************</div>
          </label>
          <small>Dirección y superadministración pueden activar doble validación.</small>
        </div>
      </section>

      <section className="conecta-public__venues">
        <div className="conecta-public__section-head conecta-public__section-head--split">
          <div>
            <p className="eyebrow">Espacios Cultura Conecta</p>
            <h2>Salas para pensar, decidir y presentar mejor.</h2>
          </div>
          <p>
            Podemos usar este bloque para promocionar salas, agenda de eventos, encuentros privados y experiencias
            empresariales conectadas al ecosistema Cultura Conecta.
          </p>
        </div>
        <div className="conecta-public__venues-grid">
          {venueCards.map((card) => (
            <article key={card.title}>
              <div>
                <Image alt="" fill sizes="(max-width: 900px) 100vw, 380px" src={card.image} />
              </div>
              <span>Disponible para empresas</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <a href="https://www.grupoayc.co/cultura-conecta" rel="noreferrer" target="_blank">Explorar espacio <ArrowRight aria-hidden="true" size={16} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="conecta-public__flow" id="metodo">
        <div className="conecta-public__section-head">
          <p className="eyebrow">Sistema vivo 24/7</p>
          <h2>Circuito cerrado, pero aplicable.</h2>
          <p>El circuito no es una sección decorativa: será la lógica que mueve notificaciones, acuses, revisiones y decisiones.</p>
        </div>
        <div className="conecta-public__flow-grid">
          {accessSteps.map(([title, text], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="conecta-public__services" id="servicios">
        <div className="conecta-public__section-head">
          <p className="eyebrow">Cultura Conecta comercial</p>
          <h2>La plataforma abre la puerta. La metodología acompaña el cambio.</h2>
        </div>
        <div className="conecta-public__services-grid">
          {offerings.map(([title, text], index) => (
            <article key={title}>
              {index === 0 ? <Network aria-hidden="true" size={22} /> : index === 1 ? <CalendarDays aria-hidden="true" size={22} /> : index === 2 ? <Target aria-hidden="true" size={22} /> : <Layers aria-hidden="true" size={22} />}
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="conecta-public__closing" id="contacto">
        <div>
          <Sparkles aria-hidden="true" size={24} />
          <h2>Vitrina pública, operación privada.</h2>
          <p>
            Esta página vende la visión. El organigrama, los perfiles, los informes y los datos sensibles viven dentro de la experiencia privada.
          </p>
        </div>
        <ul>
          <li><CheckCircle2 aria-hidden="true" size={18} /> Landing pública para clientes y aliados.</li>
          <li><CheckCircle2 aria-hidden="true" size={18} /> Plataforma privada para empresas activas.</li>
          <li><CheckCircle2 aria-hidden="true" size={18} /> Backend seguro para roles, evidencias y alertas.</li>
        </ul>
        <Link className="conecta-button conecta-button--primary" href="/acceso">
          Entrar al Mapa Vivo
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>
    </main>
  );
}

