
/** Print the current rendered tree, including its connector pseudo-elements. */
export async function printCurrentMap(tree: HTMLElement) {
  const popup = window.open("", "_blank", "width=1600,height=1100");
  if (!popup) return;
  popup.document.title = "Mapa actual · Cultura Conecta";
  popup.document.body.textContent = "Preparando el mapa actual…";
  await document.fonts.ready;
  if (popup.closed) return;

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
  await doc.fonts.ready;
  await Promise.all(Array.from(doc.images).map((img) => img.decode().catch(() => {})));
  if (popup.closed) return;
  // Center the visible cards, excluding the tree's asymmetric layout padding.
  const origin = clone.getBoundingClientRect();
  const cards = Array.from(clone.querySelectorAll(".org-card"))
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
