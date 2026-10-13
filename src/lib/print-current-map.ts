
/** Print the current rendered tree, including its connector pseudo-elements. */
export async function printCurrentMap(tree: HTMLElement) {
  const popup = window.open("", "_blank", "width=1600,height=1100");
  if (!popup) return;
  popup.document.title = "Mapa actual · Cultura Conecta";
  popup.document.body.textContent = "Preparando el mapa actual…";
  await document.fonts.ready;
  if (popup.closed) return;

  const agreementSources = Array.from(tree.querySelectorAll<HTMLElement>(".org-agreement__print-source"));
  const clone = tree.cloneNode(true) as HTMLElement;
  const originals = [tree, ...Array.from(tree.querySelectorAll<HTMLElement>("*"))];
  const copies = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
  const rules: string[] = [];
  const declarations = (style: CSSStyleDeclaration) =>
    Array.from(style).map((key) => `${key}:${style.getPropertyValue(key)};`).join("");

  originals.forEach((element, index) => {
    const copy = copies[index];
    copy.setAttribute("style", declarations(getComputedStyle(element)));
    copy.setAttribute("data-print-element", String(index));
    copy.removeAttribute("id");
    copy.style.animation = "none";
    copy.style.transition = "none";
    // Selection and search dimming are interaction states, not map content.
    if (element.classList.contains("org-card")) {
      copy.style.opacity = "1";
      copy.style.filter = "none";
      if (element.classList.contains("org-card--selected")) copy.style.boxShadow = "none";
    }
    for (const pseudo of ["::before", "::after"]) {
      const style = getComputedStyle(element, pseudo);
      if (style.content !== "none" && style.content !== "normal") {
        rules.push(`[data-print-element="${index}"]${pseudo}{${declarations(style)}}`);
      }
    }
  });
  clone.querySelectorAll(".org-agreement__print-source").forEach((source) => source.remove());
  clone.style.margin = "0";
  clone.style.zoom = "1";
  clone.style.transform = "none";

  const doc = popup.document;
  doc.body.replaceChildren();
  const base = doc.createElement("base");
  base.href = document.baseURI;
  doc.head.appendChild(base);
  const style = doc.createElement("style");
  style.textContent = `
    @page { size: A3 landscape; margin: 10mm; }
    html, body { margin: 0; padding: 0; background: white; }
    body { font-family: Arial, sans-serif; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    header { border-bottom: 2px solid #93c01f; padding-bottom: 10px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 22px; color: #06213f; }
    p { margin: 6px 0 0; font-size: 11px; color: #526070; }
    #map-page { width: 400mm; margin: 0 auto; }
    #map-frame { position: relative; overflow: visible; }
    #map-content { position: absolute; left: 0; top: 0; transform-origin: top left; }
    #agreement-page { width: 400mm; margin: 0 auto; break-before: page; page-break-before: always; }
    #agreement-page > header { margin-bottom: 8mm; }
    #agreement-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 8mm; }
    .agreement-print-card { min-width: 0; padding: 8mm; border: 1px solid #b9ccc5; border-radius: 4mm; background: #f7faf8; color: #173b45; break-inside: avoid; }
    .agreement-print-card .org-agreement__information { white-space: normal; writing-mode: horizontal-tb; word-break: normal; overflow-wrap: break-word; }
    .agreement-print-card h2 { margin: 2mm 0 0; color: #06213f; font-size: 20pt; line-height: 1.1; }
    .agreement-print-card h3 { margin: 5mm 0 2mm; color: #06213f; font-size: 12pt; }
    .agreement-print-card h4 { margin: 0; color: #275f55; font-size: 10pt; }
    .agreement-print-card h5 { margin: 0; color: #526070; font-size: 8pt; }
    .agreement-print-card p { margin: 2mm 0; font-size: 9pt; line-height: 1.45; }
    .agreement-print-card .org-agreement__relation { color: #275f55; font-weight: 700; text-transform: uppercase; }
    .agreement-print-card .org-agreement__code { margin-top: 4mm; color: #526070; font-size: 8pt; font-weight: 700; }
    .agreement-print-card .org-agreement__meta { display: grid; gap: 2mm; margin: 4mm 0; padding: 3mm; border: 1px solid #dce7e4; border-radius: 2mm; }
    .agreement-print-card .org-agreement__meta div { display: grid; grid-template-columns: 42mm minmax(0, 1fr); gap: 3mm; }
    .agreement-print-card .org-agreement__meta dt { color: #526070; font-size: 8pt; font-weight: 700; }
    .agreement-print-card .org-agreement__meta dd { margin: 0; font-size: 9pt; font-weight: 700; overflow-wrap: break-word; }
    .agreement-print-card .org-agreement__section { margin-top: 4mm; padding-top: 3mm; border-top: 1px solid #dce7e4; }
    .agreement-print-card .org-agreement__territory, .agreement-print-card .org-agreement__support { display: grid; gap: 1mm; margin-top: 2mm; padding: 3mm; border: 1px solid #dce7e4; border-radius: 2mm; }
    .agreement-print-card .org-agreement__source-note { margin-top: 4mm; padding-top: 3mm; border-top: 1px solid #dce7e4; color: #526070; font-size: 8pt; }
    ${rules.join("\n")}

  `;
  doc.head.appendChild(style);
  // Reuse loaded font faces so labels keep the current typography.
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule) style.sheet?.insertRule(rule.cssText, style.sheet.cssRules.length);
      }
    } catch { /* Cross-origin stylesheets may not expose their rules. */ }
  }
  const page = doc.createElement("main");
  page.id = "map-page";
  const header = doc.createElement("header");
  const title = doc.createElement("h1");
  title.textContent = "Mapa vivo de desempeño · Cultura Conecta";
  const subtitle = doc.createElement("p");
  subtitle.textContent = `Organigrama actual · ${new Date().toLocaleDateString("es-CO")}`;
  header.append(title, subtitle);
  const frame = doc.createElement("div");
  frame.id = "map-frame";
  const content = doc.createElement("div");
  content.id = "map-content";
  content.appendChild(doc.adoptNode(clone));
  frame.appendChild(content);
  page.append(header, frame);
  doc.body.appendChild(page);
  if (agreementSources.length) {
    const agreementPage = doc.createElement("section");
    agreementPage.id = "agreement-page";
    const agreementHeader = doc.createElement("header");
    const agreementTitle = doc.createElement("h1");
    agreementTitle.textContent = "Convenios institucionales";
    const agreementSubtitle = doc.createElement("p");
    agreementSubtitle.textContent = "Fichas ampliadas · relaciones institucionales fuera de la jerarquía laboral";
    agreementHeader.append(agreementTitle, agreementSubtitle);
    const agreementGrid = doc.createElement("div");
    agreementGrid.id = "agreement-grid";
    agreementSources.forEach((source) => {
      const card = doc.createElement("article");
      card.className = "agreement-print-card";
      Array.from(source.childNodes).forEach((child) => card.appendChild(doc.importNode(child, true)));
      agreementGrid.appendChild(card);
    });
    agreementPage.append(agreementHeader, agreementGrid);
    doc.body.appendChild(agreementPage);
  }
  await doc.fonts.ready;
  await Promise.all(Array.from(doc.images).map((img) => img.decode().catch(() => {})));
  if (popup.closed) return;
  // Center the visible cards, excluding the tree's asymmetric layout padding.
  const origin = clone.getBoundingClientRect();
  const cards = Array.from(clone.querySelectorAll(".org-card, .org-agreement"))
    .map((card) => card.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  const inset = 24;
  const left = cards.length ? Math.min(...cards.map((rect) => rect.left)) - origin.left - inset : 0;
  const top = cards.length ? Math.min(...cards.map((rect) => rect.top)) - origin.top - inset : 0;
  const right = cards.length ? Math.max(...cards.map((rect) => rect.right)) - origin.left + inset : clone.scrollWidth;
  const bottom = cards.length ? Math.max(...cards.map((rect) => rect.bottom)) - origin.top + inset : clone.scrollHeight;
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const pageWidth = page.getBoundingClientRect().width;
  // A3 printable area is 400 × 277 mm; reserve the header and rounding space.
  const frameHeight = Math.floor(pageWidth * 277 / 400 - frame.offsetTop - 8);
  const scale = Math.min((pageWidth - 16) / width, frameHeight / height, 1);
  content.style.transform = `scale(${scale})`;
  content.style.left = `${(pageWidth - width * scale) / 2 - left * scale}px`;
  content.style.top = `${(frameHeight - height * scale) / 2 - top * scale}px`;
  frame.style.height = `${frameHeight}px`;
  popup.focus();
  popup.print();
}
