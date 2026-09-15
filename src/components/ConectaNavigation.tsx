import Image from "next/image";
import Link from "next/link";

export function ConectaNavigation({ inMap = false }: { inMap?: boolean }) {
  const base = inMap ? "" : "/mapa-vivo";
  return <nav className="org-nav" aria-label="Navegación principal">
    <Link href="/mapa-vivo" className="brand-mark brand-mark--logo" aria-label="Cultura Conecta">
      <Image alt="Cultura Conecta" className="nav-logo" height={1165} priority src="/brand/cultura-conecta-isotipo-3d.png" width={1350} />
    </Link>
    <div className="org-nav__links">
      <Link href={`${base}#organigrama`}>Mapa vivo</Link>
      <Link href={`${base}#detalle`}>Informe de gestión</Link>
      <Link href={`${base}#estandar`}>Método</Link>
    </div>
  </nav>;
}
