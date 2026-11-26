// Plano 2D ilustrado em SVG, desenhado a partir dos dados reais (data/parque.json, gerado por scripts/plano2d_dados.py;
// coordenadas locais em metros = real − (442000, 4474000)). Sem motor de mapas nem SDK: a entrada e a Visita no
// celular usam-no como alternativa leve ao 3D. Arrastar e aproximar movem o SVG por transform (GPU); quando o gesto
// pára, muda-se o viewBox (o desenho volta a ficar nítido e os rótulos voltam ao tamanho certo).
// Adaptado do protótipo design/mockups/mapa2d/mapa-svg.js (sessão do mapa 2D, 2026-11-25).
import { t, dado } from "./i18n.js";

const NS = "http://www.w3.org/2000/svg";
const el = (n, a = {}, pai) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (pai) pai.appendChild(e); return e; };
const linha = (pts) => { let s = ""; for (let i = 0; i < pts.length; i++) s += (i ? "L" : "M") + pts[i][0] + " " + (-pts[i][1]); return s; };
const anel = (pts) => linha(pts) + "Z";
const centro = (pts) => { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; };
const comprimento = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function carregarPlano(url = "data/parque.json") { return (await fetch(url)).json(); }

// larguras reais aproximadas dos caminhos (m)
const LARG = { pedestrian: 9, service: 5, footway: 3.2, path: 2.2, steps: 3 };
export const ZONAS_PLANO = ["piloto", "cristal", "velazquez", "rosaleda", "parterre", "estatuas", "vacas", "cecilio"];
const ESCONDER_EDIF = /^(CT |Torre telegr)/;
const NAO_CONTROLO = ".pl-ctl, .pl-ficha, .mapa-acoes";

// op: { traco, aoEscolher(sel), aoAcao(tipo, sel) }  — tipo: "porta" (como chegar) ou "zona" (ver em 3D)
export function montarPlano(caixa, d, op = {}) {
  const traco = op.traco !== false;
  const [x0, y0, x1, y1] = d.caixa;
  const LIMITE = { x: x0 - 260, y: -(y1 + 260), w: x1 - x0 + 520, h: y1 - y0 + 520 };
  const svg = el("svg", { class: "plano", role: "img", preserveAspectRatio: "xMidYMid meet" });
  const defs = el("defs", {}, svg);
  defs.innerHTML = `
    <filter id="rasgo" x="-2%" y="-2%" width="104%" height="104%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="4"/>
      <feDisplacementMap in="SourceGraphic" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="recorte" x="-5%" y="-5%" width="110%" height="110%" primitiveUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#2a3a22" flood-opacity="0.25"/>
    </filter>
    <pattern id="ondas" patternUnits="userSpaceOnUse" width="16" height="6">
      <path d="M0 3 q4 -2.2 8 0 t8 0" fill="none" stroke="#5aaed0" stroke-width="0.45" opacity="0.55"/>
    </pattern>`;
  const g = (cls, pai = svg, a = {}) => el("g", { class: cls, ...a }, pai);
  const caminho = (dd, a, pai) => el("path", { d: dd, ...a }, pai);

  // 1. o parque como folha recortada pousada no papel
  caminho(anel(d.limite), { fill: "var(--m-base)", filter: "url(#recorte)" }, g("base"));
  // 2. superfícies (com o traço tremido do desenho à mão)
  const fundos = g("fundos", svg, traco ? { filter: "url(#rasgo)" } : {});
  caminho(d.relva.flat().map(anel).join(""), { fill: "var(--m-relva)" }, fundos);
  caminho(d.campo.flat().map(anel).join(""), { fill: "var(--m-campo)" }, fundos);
  caminho(d.infantil.flat().map(anel).join(""), { fill: "var(--m-infantil)" }, fundos);
  // 3. caminhos: debrum e miolo
  const porTipo = {};
  for (const c of d.caminhos) { const k = LARG[c.t] ? c.t : null; if (!k) continue; (porTipo[k] ??= []).push(linha(c.l)); }
  const cam = g("caminhos", svg, { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" });
  caminho(d.praca.flat().map(anel).join(""), { fill: "var(--m-caminho)", stroke: "var(--m-caminho-borda)", "stroke-width": 1 }, cam);
  for (const k of ["footway", "path", "steps", "service", "pedestrian"]) if (porTipo[k]) caminho(porTipo[k].join(""), { stroke: "var(--m-caminho-borda)", "stroke-width": LARG[k] + 1.4 }, cam);
  for (const k of ["footway", "path", "steps", "service", "pedestrian"]) if (porTipo[k]) caminho(porTipo[k].join(""), { stroke: "var(--m-caminho)", "stroke-width": LARG[k], ...(k === "steps" ? { "stroke-dasharray": "0.6 1.2", "stroke-linecap": "butt" } : {}) }, cam);
  // 4. água: cor, ondas gravadas, margem
  const agua = g("agua", svg, traco ? { filter: "url(#rasgo)" } : {});
  const da = d.agua.map((a) => a.r.map(anel).join("")).join("");
  caminho(da, { fill: "var(--m-agua)" }, agua);
  caminho(da, { fill: "url(#ondas)" }, agua);
  caminho(da, { fill: "none", stroke: "var(--m-agua-borda)", "stroke-width": 0.9 }, agua);
  // 5. sebes
  caminho(d.sebes.map(linha).join(""), { fill: "none", stroke: "var(--m-sebe)", "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, g("sebes"));
  // 6. árvores: cada copa é um traço de comprimento zero com ponta redonda (um só <path> por classe); sombra deslocada = papel recortado
  const arv = g("arvores");
  const classes = [[4.6, "#93b765"], [7, "var(--m-copa)"], [9.6, "#6a9446"]];
  const dd = classes.map(() => []);
  for (let i = 0; i < d.arvores.length; i += 3) {
    const h = d.arvores[i + 2];
    dd[h <= 7 ? 0 : h <= 15 ? 1 : 2].push("M" + d.arvores[i] + " " + (-d.arvores[i + 1]) + "h0");
  }
  classes.forEach(([w], i) => caminho(dd[i].join(""), { stroke: "var(--m-copa-esc)", "stroke-width": w, "stroke-linecap": "round", transform: "translate(0.9 0.9)", opacity: 0.55 }, arv));
  classes.forEach(([w, cor], i) => caminho(dd[i].join(""), { stroke: cor, "stroke-width": w, "stroke-linecap": "round" }, arv));
  // 7. muros e grades interiores
  caminho(d.muros.map((m) => linha(m.l)).join(""), { fill: "none", stroke: "var(--carvao)", "stroke-width": 0.6, "vector-effect": "non-scaling-stroke", opacity: 0.45 }, g("muros"));
  // 8. edifícios e monumentos: papel branco com traço de tinta
  const ed = g("edificios");
  for (const e of d.edificios) {
    const p = caminho(e.r.map(anel).join(""), { fill: "var(--m-edif)", stroke: "var(--carvao)", "stroke-width": 1, "vector-effect": "non-scaling-stroke", "stroke-linejoin": "round" }, ed);
    if (e.n && !ESCONDER_EDIF.test(e.n)) { p.classList.add("alvo"); p.dataset.k = "edif"; p.dataset.n = e.n; }
  }
  for (const m of d.monumentos) {
    const p = caminho(m.r.map(anel).join(""), { fill: "#f3e2ad", stroke: "var(--carvao)", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }, ed);
    if (m.n) { p.classList.add("alvo"); p.dataset.k = "edif"; p.dataset.n = m.n; }
  }
  // 9. a verja: linha de pinho
  caminho(anel(d.limite), { fill: "none", stroke: "var(--pinho)", "stroke-width": 2.2, "vector-effect": "non-scaling-stroke" }, g("verja"));
  // 10. zonas modeladas no 3D
  const z3 = g("zonas3d");
  for (const z of ZONAS_PLANO) {
    const b = d.zonas[z]; if (!b) continue;
    el("rect", { class: "zona3d alvo", "data-k": "zona", "data-z": z, x: b[0], y: -b[3], width: b[2] - b[0], height: b[3] - b[1], rx: 18, "stroke-width": 1.6, "vector-effect": "non-scaling-stroke", "pointer-events": "all" }, z3); // a zona inteira é tocável (a borda sozinha era difícil de acertar com o dedo)
  }
  // 11. arte pública e portas (raio em CSS: tamanho constante no ecrã)
  const ar = g("arte");
  d.arte.forEach((a, i) => el("circle", { class: "alvo", "data-k": "arte", "data-i": i, cx: a.x, cy: -a.y, style: "r: calc(var(--u) * 3.6px); stroke-width: calc(var(--u) * 1.2px)", fill: "var(--calendula)", stroke: "var(--carvao)" }, ar));
  const po = g("portas");
  d.portas.forEach((p, i) => {
    const gp = g("porta alvo", po, { "data-k": "porta", "data-i": i });
    el("circle", { class: "p", cx: p.x, cy: -p.y, fill: "var(--pinho)", stroke: "#fff", style: `r: calc(var(--u) * ${p.mon ? 7.5 : 5.5}px); stroke-width: calc(var(--u) * 2px)` }, gp);
    el("circle", { cx: p.x, cy: -p.y, fill: "transparent", style: "r: calc(var(--u) * 16px)" }, gp); // alvo de toque de 32 px
  });
  // 12. rótulos
  const rot = g("rotulos");
  const texto = (x, y, cls, s) => { const tx = el("text", { x, y: -y, class: cls, "text-anchor": "middle" }, rot); escrever(tx, s); return tx; };
  function escrever(tx, s) {           // rótulos compridos de zona em duas linhas (partidos no espaço mais perto do meio)
    tx.textContent = "";
    if (s.length <= 20 || !tx.classList.contains("r-zona")) { tx.textContent = s; return; }
    const meio = s.length / 2; let k = -1;
    for (let i = 0; i < s.length; i++) if (s[i] === " " && (k < 0 || Math.abs(i - meio) < Math.abs(k - meio))) k = i;
    [s.slice(0, k), s.slice(k + 1)].forEach((parte, i) => { const ts = el("tspan", { x: tx.getAttribute("x"), dy: i ? "1.05em" : "-0.2em" }, tx); ts.textContent = parte; });
  }
  const zonaPos = {};
  for (const z of ZONAS_PLANO) { const b = d.zonas[z]; if (b) zonaPos[z] = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; }
  const est = d.agua.find((a) => a.n === "El Estanque Grande");
  if (est) { const r = est.r[0], xs = r.map((p) => p[0]), ys = r.map((p) => p[1]); zonaPos.piloto = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]; }
  const rz = {};
  for (const z of ZONAS_PLANO) if (zonaPos[z]) rz[z] = texto(zonaPos[z][0], zonaPos[z][1], "r-zona", t("pl.zona." + z));
  for (const e of d.edificios) {         // nomes de edifícios só muito perto
    if (!e.n || ESCONDER_EDIF.test(e.n) || /Velázquez|Cristal|Casa de Vacas/.test(e.n)) continue;
    const [cx, cy] = centro(e.r[0]); texto(cx, cy - 9, "r-edif so-mto-perto", e.n);
  }
  // nomes dos paseos ao longo do traçado (o troço mais comprido de cada nome; sempre da esquerda para a direita)
  const porNome = {};
  for (const c of d.caminhos) if (c.n && (c.t === "pedestrian" || c.t === "footway")) { const L = comprimento(c.l); if (!porNome[c.n] || porNome[c.n].L < L) porNome[c.n] = { L, l: c.l }; }
  let k = 0;
  for (const [n, { L, l }] of Object.entries(porNome)) {
    if (L < 140) continue;
    const pts = l[0][0] <= l[l.length - 1][0] ? l : [...l].reverse();
    const id = "plpaseo" + k++;
    el("path", { id, d: linha(pts), fill: "none" }, defs);
    const tx = el("text", { class: "r-paseo so-perto", dy: "0.35em" }, rot);
    const tp = el("textPath", { href: "#" + id, startOffset: "50%", "text-anchor": "middle" }, tx); tp.textContent = n;
  }
  d.portas.forEach((p) => {
    if (!p.n) return;                    // portas sem nome: só o ponto (o nome vem na ficha, traduzido)
    const ang = Math.atan2(p.y - (y0 + y1) / 2, p.x - (x0 + x1) / 2), ox = Math.cos(ang), oy = Math.sin(ang); // rótulo para fora do parque
    const tx = el("text", { x: p.x, y: -p.y, class: "r-porta " + (p.mon ? "" : "so-perto"), "text-anchor": ox > 0.35 ? "start" : ox < -0.35 ? "end" : "middle",
      style: `transform: translate(calc(var(--u) * ${(ox * 12).toFixed(1)}px), calc(var(--u) * ${(-oy * 12 + 4).toFixed(1)}px))` }, rot);
    tx.textContent = p.n.replace(/^Puerta (de la |del |de )?/, "");
  });

  // ficha: cartão branco pousado no papel (como o popup do mapa 3D)
  const ficha = document.createElement("aside");
  ficha.className = "pl-ficha";
  ficha.setAttribute("aria-live", "polite");
  caixa.appendChild(svg);
  caixa.appendChild(ficha);
  const nomeTraduz = () => svg.setAttribute("aria-label", t("pl.aria"));
  nomeTraduz();

  // ---------- vista: viewBox + transform durante os gestos ----------
  let vb = null, vb0 = null, compromisso = 0;
  const W = () => caixa.clientWidth || 1, H = () => caixa.clientHeight || 1;
  function ajustar(v) {
    v.h = v.w * H() / W();
    const maxW = LIMITE.w * 1.1; if (v.w > maxW) { const c = v.x + v.w / 2, m = v.y + v.h / 2; v.w = maxW; v.h = v.w * H() / W(); v.x = c - v.w / 2; v.y = m - v.h / 2; }
    if (v.w < 50) { const c = v.x + v.w / 2, m = v.y + v.h / 2; v.w = 50; v.h = v.w * H() / W(); v.x = c - v.w / 2; v.y = m - v.h / 2; }
    const cx = Math.min(Math.max(v.x + v.w / 2, LIMITE.x), LIMITE.x + LIMITE.w), cy = Math.min(Math.max(v.y + v.h / 2, LIMITE.y), LIMITE.y + LIMITE.h);
    v.x = cx - v.w / 2; v.y = cy - v.h / 2; return v;
  }
  function fixar() {
    svg.style.transform = ""; svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); vb0 = { ...vb };
    const u = vb.w / W(); svg.style.setProperty("--u", u);
    svg.classList.toggle("pequeno", W() < 560); svg.classList.toggle("perto", u < 1.15); svg.classList.toggle("mto-perto", u < 0.45);
  }
  function mostrar() {                   // pinta vb a partir do desenho fixado em vb0, só com transform
    const s = vb0.w / vb.w, tx = (vb0.x - vb.x) / vb.w * W(), ty = (vb0.y - vb.y) / vb.h * H();
    svg.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    clearTimeout(compromisso); compromisso = setTimeout(fixar, 140);
  }
  function ajustarInteiro(x, y, w, h) {  // cabe w x h no ecrã
    const r = W() / H(); return w / h > r ? { x, y: y + h / 2 - w / r / 2, w, h: w / r } : { x: x + w / 2 - h * r / 2, y, w: h * r, h };
  }
  function inteiro() { const px = 0.13 * (x1 - x0), py = 0.09 * (y1 - y0); return ajustarInteiro(x0 - px, -(y1 + py), x1 - x0 + 2 * px, y1 - y0 + 2 * py); }
  vb = inteiro(); fixar();
  // O tamanho certo só se conhece depois do layout, e muda entre entrada, app, celular e vista ampliada.
  // Enquanto a pessoa não mexeu no plano, cada mudança de tamanho volta a enquadrar o parque inteiro;
  // depois disso, mantém-se o centro e a escala que ela escolheu.
  let mexeu = false, tamanho = [W(), H()];
  new ResizeObserver(() => {
    if (W() < 20 || H() < 20) return;
    const [w0, h0] = tamanho; tamanho = [W(), H()];
    if (Math.abs(W() - w0) <= 2 && Math.abs(H() - h0) <= 2) return;
    if (!mexeu) { cancelAnimationFrame(anim); vb = inteiro(); fixar(); return; }
    const c = { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
    vb = ajustar({ x: c.x - vb.w / 2, y: c.y - vb.w * H() / W() / 2, w: vb.w }); fixar();
  }).observe(caixa);

  const paraUser = (px, py) => { const r = caixa.getBoundingClientRect(); return [vb.x + (px - r.left) / W() * vb.w, vb.y + (py - r.top) / H() * vb.h]; };
  function zoomEm(f, px, py) {
    const [ux, uy] = paraUser(px, py); const r = caixa.getBoundingClientRect();
    const nw = vb.w / f; const v = { w: nw, h: nw * H() / W() };
    v.x = ux - (px - r.left) / W() * v.w; v.y = uy - (py - r.top) / H() * v.h;
    vb = ajustar(v); mostrar();
  }
  let anim = 0;
  function voar(alvo, ms = 520) {
    mexeu = true;
    cancelAnimationFrame(anim); const a = { ...vb }, b = ajustar({ ...alvo }), t0 = performance.now();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) ms = 1;
    const passo = (now) => { const kk = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - kk, 3);
      vb = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, w: a.w + (b.w - a.w) * e, h: a.h + (b.h - a.h) * e }; mostrar();
      if (kk < 1) anim = requestAnimationFrame(passo); };
    anim = requestAnimationFrame(passo);
  }
  function zoomAlvo(f, px, py) { const [ux, uy] = paraUser(px, py); const r = caixa.getBoundingClientRect(); const w = vb.w / f, h = w * H() / W();
    return { x: ux - (px - r.left) / W() * w, y: uy - (py - r.top) / H() * h, w, h }; }

  // ---------- gestos (rato, dedo e pinça) ----------
  const ptr = new Map(); let mov = 0, pinca = null;
  caixa.addEventListener("pointerdown", (e) => { if (e.target.closest(NAO_CONTROLO)) return; mexeu = true; try { caixa.setPointerCapture(e.pointerId); } catch { /* ponteiro sintético ou já libertado */ } ptr.set(e.pointerId, [e.clientX, e.clientY]); mov = 0; cancelAnimationFrame(anim);
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinca = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; } });
  caixa.addEventListener("pointermove", (e) => {
    if (!ptr.has(e.pointerId)) return; const ant = ptr.get(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 1) { const dx = e.clientX - ant[0], dy = e.clientY - ant[1]; mov += Math.abs(dx) + Math.abs(dy);
      vb = ajustar({ ...vb, x: vb.x - dx / W() * vb.w, y: vb.y - dy / H() * vb.h }); mostrar(); }
    else if (ptr.size === 2 && pinca) { const [a, b] = [...ptr.values()]; const d2 = Math.hypot(a[0] - b[0], a[1] - b[1]); mov += 99;
      zoomEm(d2 / pinca.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinca.d = d2; }
  });
  const fim = (e) => { if (!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId); if (ptr.size < 2) pinca = null;
    if (e.type === "pointerup" && mov < 7 && ptr.size === 0) tocar(e); };
  caixa.addEventListener("pointerup", fim); caixa.addEventListener("pointercancel", fim);
  caixa.addEventListener("wheel", (e) => { if (e.target.closest(NAO_CONTROLO)) return; mexeu = true; e.preventDefault(); zoomEm(Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY); }, { passive: false });
  caixa.addEventListener("dblclick", (e) => { if (!e.target.closest(NAO_CONTROLO)) voar(zoomAlvo(2, e.clientX, e.clientY), 320); });

  // ---------- seleção e ficha ----------
  let selEl = null, sel = null;
  function tocar(e) {
    const alvo = document.elementsFromPoint(e.clientX, e.clientY).map((n) => n.closest && n.closest(".alvo")).find(Boolean);
    selEl?.classList.remove("sel"); selEl = null; sel = null;
    if (!alvo) { desenharFicha(); op.aoEscolher?.(null); return; }
    selEl = alvo; alvo.classList.add("sel");
    const kk = alvo.dataset.k;
    sel = kk === "porta" ? { k: kk, ...d.portas[+alvo.dataset.i] } : kk === "arte" ? { ...d.arte[+alvo.dataset.i], k2: d.arte[+alvo.dataset.i].k, k: kk }
      : kk === "zona" ? { k: kk, z: alvo.dataset.z } : { k: kk, n: alvo.dataset.n };
    desenharFicha();
    op.aoEscolher?.(sel);
  }
  function desenharFicha() {
    if (!sel) { ficha.classList.remove("aberta"); return; }
    const s = sel;
    let h = "";
    if (s.k === "porta") {
      h = `<span class="rot">${esc(t(s.mon ? "pl.monumental" : "pl.puerta"))}</span><h2>${esc(s.n || t("pl.sin_nome"))}</h2><dl>` +
        (s.metro ? `<dt>${esc(t("pl.metro"))}</dt><dd>${esc(s.metro)}</dd>` : "") + (s.bus ? `<dt>${esc(t("pl.bus"))}</dt><dd>${esc(dado("texto", s.bus))}</dd>` : "") +
        `</dl>${op.aoAcao ? `<button type="button" class="pl-acao" data-a="porta">${esc(t("pl.llegar"))}</button>` : ""}`;
    } else if (s.k === "arte") {
      const tipo = t("pl.k." + s.k2);
      h = `<span class="rot">${esc(tipo.startsWith("pl.k.") ? s.k2 : tipo)}</span><h2>${esc(s.t)}</h2><dl><dt>${esc(t("pl.autor"))}</dt><dd>${esc(s.a)}</dd>` +
        (s.ano ? `<dt>${esc(t("pl.ano"))}</dt><dd>${s.ano}</dd>` : "") + `</dl>`;
    } else if (s.k === "zona") {
      h = `<span class="rot">${esc(t("pl.zona_3d"))}</span><h2>${esc(t("pl.zona." + s.z))}</h2>` +
        (op.aoAcao ? `<button type="button" class="pl-acao" data-a="zona">${esc(t("pl.ver3d"))}</button>` : "");
    } else h = `<h2>${esc(s.n)}</h2>`;
    ficha.innerHTML = `<button class="x" type="button" aria-label="${esc(t("pl.cerrar"))}">✕</button>` + h;
    ficha.querySelector(".x").onclick = () => { selEl?.classList.remove("sel"); selEl = null; sel = null; desenharFicha(); };
    ficha.querySelector(".pl-acao")?.addEventListener("click", (e) => op.aoAcao?.(e.currentTarget.dataset.a, s));
    ficha.classList.add("aberta");
  }
  addEventListener("retiro:idioma", () => {
    for (const z in rz) escrever(rz[z], t("pl.zona." + z));
    nomeTraduz();
    desenharFicha();
  });

  return {
    svg,
    inteiro: () => { voar(inteiro()); mexeu = false; },
    zoom: (f) => { const r = caixa.getBoundingClientRect(); voar(zoomAlvo(f, r.left + r.width / 2, r.top + r.height / 2), 280); },
    irZona: (z) => { const b = d.zonas[z]; if (b) voar(ajustarInteiro(b[0] - 30, -(b[3] + 30), b[2] - b[0] + 60, b[3] - b[1] + 60)); },
    irPonto: (x, y, w = 260) => voar(ajustarInteiro(x - w / 2, -y - w / 2, w, w)),
    camada: (nome, on) => svg.classList.toggle("sem-" + nome, !on),
    fecharFicha: () => { selEl?.classList.remove("sel"); selEl = null; sel = null; desenharFicha(); },
    // medição: percorre um caminho de câmara fixo pelo mesmo código dos gestos; devolve quadros/s e o custo de "fixar"
    async medir(seg = 4) {
      const ini = inteiro(); vb = { ...ini }; fixar(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      let q = 0; const t0 = performance.now(); const dur = seg * 1000;
      await new Promise((res) => { const passo = (now) => { q++; const kk = (now - t0) / dur; const z = 1 + 5 * Math.sin(Math.PI * Math.min(kk, 1));
        const w = ini.w / z; vb = { x: ini.x + ini.w / 2 - w / 2 + Math.sin(kk * 6) * 80, y: ini.y + ini.h / 2 - w * H() / W() / 2, w, h: w * H() / W() };
        const s = vb0.w / vb.w, tx = (vb0.x - vb.x) / vb.w * W(), ty = (vb0.y - vb.y) / vb.h * H(); svg.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
        if (now - t0 < dur) requestAnimationFrame(passo); else res(); }; requestAnimationFrame(passo); });
      const fps = q / ((performance.now() - t0) / 1000);
      const custos = [];
      for (const z of [1, 2, 4, 8, 3, 1]) { const w = ini.w / z; vb = ajustar({ x: ini.x + ini.w / 2 - w / 2, y: ini.y + ini.h / 2 - w * H() / W() / 2, w });
        const a = performance.now(); fixar(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); custos.push(Math.round(performance.now() - a)); }
      vb = inteiro(); fixar();
      return { fps: Math.round(fps * 10) / 10, fixar_ms: custos, n_elementos: svg.querySelectorAll("*").length };
    },
  };
}
