// Modo passeio: a câmara à altura dos olhos de uma pessoa a caminhar pelos caminhos reais do parque.
// Percursos preparados por scripts/passeio_prepare.py em data/passeio/percursos.json (rede de caminhos do OSM,
// x/y/z a cada ~1 m em EPSG:25830; z = chão do visor). O SDK não tem navegação na primeira pessoa: a câmara é
// posta à mão em cada quadro (ver docs/referencias/modo_passeio_sdk.md).
// Guiado: segue um percurso a 1,3 m/s (x1, x2, x4, x8), pausa e retoma, cursor para saltar. Arrastar no mapa olha à volta.
// Livre: W/S ou ↑/↓ andam, A/D ou ←/→ viram, Q/E andam de lado; no celular, botões no painel. Não entra em
// edifícios, água nem áreas de monumentos, nem sai do limite do parque. Sair devolve a câmara onde estava.

import { t as txt, dado, fmt, aplicar } from "./i18n.js"; // "txt": quadro(t) usa t para o tempo

const OLHOS = 1.65;     // m acima do chão
const VEL = 1.3;        // m/s, passo normal
const OLHAR_FRENTE = 7; // m à frente para a direção do olhar (suaviza as curvas)
const TILT = 86;        // 90 = horizontal; quem caminha olha ligeiramente para baixo
const FOV = 70;

export async function iniciarPasseio({ view, SR }) {
  const [Camera, Point] = await Promise.all([
    $arcgis.import("@arcgis/core/Camera.js"),
    $arcgis.import("@arcgis/core/geometry/Point.js"),
  ]);
  const dados = await (await fetch("data/passeio/percursos.json", { cache: "no-store" })).json();
  const percursos = dados.percursos.map((p) => {
    const pts = p.pontos;
    const s = new Float64Array(pts.length);
    for (let i = 1; i < pts.length; i++) s[i] = s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { ...p, s, L: s[s.length - 1] };
  });
  const obst = dados.obstaculos.map((r) => {
    const xs = r.map((p) => p[0]), ys = r.map((p) => p[1]);
    return { r, b: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  });
  const dentro = (x, y, r) => {
    let d = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  const livre = (x, y) => dentro(x, y, dados.limite) &&
    !obst.some((o) => x >= o.b[0] - 0.4 && x <= o.b[2] + 0.4 && y >= o.b[1] - 0.4 && y <= o.b[3] + 0.4 &&
      [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]].some(([dx, dy]) => dentro(x + dx, y + dy, o.r)));

  // chão: o que o visor desenha (amostrador da vista); se ainda não houver relevo carregado, a cota do percurso
  const chao = (x, y, zRef) => {
    let z = null;
    try { z = view.groundView.elevationSampler?.queryElevation(new Point({ x, y, spatialReference: SR }))?.z; } catch { z = null; }
    if (z == null || !Number.isFinite(z)) return zRef;
    return zRef == null ? z : Math.max(z, zRef);
  };

  // ---- interface (painel criado aqui). Entra-se por entrar() (separador Paseos da casca) ou, se existir, pelo botão #passeioBtn.
  // Os textos vêm de i18n.js; ao mudar de idioma o painel é retraduzido.
  const btn = document.getElementById("passeioBtn");
  const painel = document.createElement("section");
  painel.id = "passeio";
  painel.className = "panel";
  painel.hidden = true;
  painel.dataset.i18nAttr = "aria-label:pas.painel";
  const opcoes = () => percursos.map((p) => `<option value="${p.id}">${txt("pas.opcao", { nome: dado("percurso", p), km: fmt.num(p.L / 1000, 1) })}</option>`).join("") +
    `<option value="livre">${txt("pas.livre")}</option>`;
  painel.innerHTML = `
    <div class="pas-linha"><strong data-i18n="pas.titulo"></strong><button type="button" id="pasSair" data-i18n="pas.sair"></button></div>
    <select id="pasPercurso" data-i18n-attr="aria-label:pas.percurso">${opcoes()}</select>
    <div class="pas-linha" id="pasGuiado">
      <button type="button" id="pasPlay" aria-pressed="false"></button>
      <label><span data-i18n="pas.velocidade"></span> <select id="pasVel"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label>
    </div>
    <input type="range" id="pasProg" min="0" max="1000" value="0" data-i18n-attr="aria-label:pas.posicao">
    <div id="pasPad" hidden>
      <button type="button" data-k="esq" data-i18n-attr="aria-label:pas.esq">◀</button>
      <button type="button" data-k="frente" data-i18n-attr="aria-label:pas.frente">▲</button>
      <button type="button" data-k="dir" data-i18n-attr="aria-label:pas.dir">▶</button>
      <button type="button" data-k="ladoE" data-i18n-attr="aria-label:pas.ladoE">⇠</button>
      <button type="button" data-k="tras" data-i18n-attr="aria-label:pas.tras">▼</button>
      <button type="button" data-k="ladoD" data-i18n-attr="aria-label:pas.ladoD">⇢</button>
    </div>
    <p id="pasInfo" role="status"></p>`;
  document.body.appendChild(painel);
  aplicar(painel);
  const $ = (id) => painel.querySelector("#" + id);
  const sel = $("pasPercurso"), play = $("pasPlay"), velSel = $("pasVel"), prog = $("pasProg"), info = $("pasInfo");
  let fimPercurso = false;
  addEventListener("retiro:idioma", () => {           // os data-i18n já foram retraduzidos; faltam as opções e o botão
    const v = sel.value;
    sel.innerHTML = opcoes();
    sel.value = v;
    definirPausa(pausa, fimPercurso);
  });

  // ---- estado
  let ativo = false, modo = "guiado", pc = percursos[0], s = 0, pausa = false, fator = 1;
  let camAntes = null, restricaoAntes = null, raf = 0, tAnt = 0, h = 0, zOlho = null, olharH = 0, olharT = 0;
  let livreXY = null, livreH = 0;
  const teclas = new Set();
  let quadros = 0, t0quadros = 0;

  const ponto = (p, d) => {           // posição a d metros do início (interpolação linear entre pontos a ~1 m)
    d = Math.min(Math.max(d, 0), p.L);
    let lo = 0, hi = p.s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p.s[m] <= d) lo = m; else hi = m; }
    const a = p.pontos[lo], b = p.pontos[hi], t = (d - p.s[lo]) / ((p.s[hi] - p.s[lo]) || 1);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  };
  const rumo = (a, b) => (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
  const difAng = (a, b) => ((b - a + 540) % 360) - 180;

  function porCamara(x, y, zc, dt) {
    const alvo = zc + OLHOS;
    // subida suave (degraus e ruído do relevo), mas nunca abaixo de 1,2 m do chão
    zOlho = zOlho == null ? alvo : zOlho + (alvo - zOlho) * (1 - Math.exp(-dt / 0.25));
    zOlho = Math.max(zOlho, zc + 1.2);
    view.camera = new Camera({
      position: { x, y, z: zOlho, spatialReference: SR },
      heading: h + olharH,
      tilt: Math.min(Math.max(TILT + olharT, 45), 120),
      fov: FOV,
    });
  }

  function quadro(t) {
    if (!ativo) return;
    const dt = Math.min((t - (tAnt || t)) / 1000, 0.25); // com poucos fps o passo não abranda tanto
    tAnt = t;
    quadros++;
    if (modo === "guiado") {
      if (!pausa) s = Math.min(s + VEL * fator * dt, pc.L);
      const p = ponto(pc, s), q = ponto(pc, s + OLHAR_FRENTE);
      const alvoH = s >= pc.L - 0.5 ? h : rumo(p, q);
      h += difAng(h, alvoH) * (1 - Math.exp(-dt / (0.7 / Math.sqrt(fator))));
      porCamara(p[0], p[1], chao(p[0], p[1], p[2]), dt);
      if (document.activeElement !== prog) prog.value = String(Math.round((s / pc.L) * 1000));
      const falta = pc.L - s;
      info.textContent = falta < 0.5 ? txt("pas.chegou")
        : txt("pas.progresso", { s: Math.round(s), L: Math.round(pc.L), min: Math.ceil(falta / (VEL * fator) / 60) });
      if (falta < 0.5 && !pausa) definirPausa(true, true);
    } else {
      const vira = (teclas.has("esq") ? -1 : 0) + (teclas.has("dir") ? 1 : 0);
      const anda = (teclas.has("frente") ? 1 : 0) - (teclas.has("tras") ? 1 : 0);
      const lado = (teclas.has("ladoD") ? 1 : 0) - (teclas.has("ladoE") ? 1 : 0);
      livreH += vira * 60 * dt;
      h = livreH;
      const v = VEL * fator * (teclas.has("corre") ? 3 : 1) * dt, r = (livreH * Math.PI) / 180;
      const dx = Math.sin(r) * anda * v + Math.cos(r) * lado * v, dy = Math.cos(r) * anda * v - Math.sin(r) * lado * v;
      const [x, y] = livreXY;
      // desliza ao longo do obstáculo: tenta o movimento todo, depois só em x, depois só em y
      if (dx || dy) {
        if (livre(x + dx, y + dy)) livreXY = [x + dx, y + dy];
        else if (livre(x + dx, y)) livreXY = [x + dx, y];
        else if (livre(x, y + dy)) livreXY = [x, y + dy];
      }
      porCamara(livreXY[0], livreXY[1], chao(livreXY[0], livreXY[1], livreXY[2] ?? null), dt);
      info.textContent = txt("pas.livre_info", { x: Math.round(livreXY[0]), y: Math.round(livreXY[1]) });
    }
    raf = requestAnimationFrame(quadro);
  }

  function definirPausa(v, fim = false) {
    pausa = v;
    fimPercurso = v && fim;
    play.textContent = txt(v ? (fim ? "pas.recomecar" : "pas.continuar") : "pas.pausa");
    play.setAttribute("aria-pressed", String(v));
  }

  function escolher(id) {
    olharH = 0; olharT = 0; zOlho = null;
    if (id === "livre") {
      // começa onde a câmara do passeio estiver (ou no início do percurso escolhido antes)
      const p = modo === "guiado" ? ponto(pc, s) : livreXY;
      livreXY = [p[0], p[1], p[2]];
      livreH = h;
      modo = "livre";
    } else {
      pc = percursos.find((p) => p.id === id) ?? percursos[0];
      s = 0; modo = "guiado";
      h = rumo(ponto(pc, 0), ponto(pc, OLHAR_FRENTE));
      definirPausa(false);
    }
    $("pasGuiado").querySelector("#pasPlay").hidden = modo !== "guiado";
    prog.hidden = modo !== "guiado";
    $("pasPad").hidden = modo !== "livre";
    teclas.clear();
  }

  // ---- olhar à volta arrastando no mapa (rato ou dedo) sem tirar a câmara do caminho
  const bloqueios = [
    view.on("drag", (e) => {
      if (!ativo) return;
      e.stopPropagation();
      if (e.action === "update") {
        const dx = e.x - (bloqueios.ultimo?.x ?? e.x), dy = e.y - (bloqueios.ultimo?.y ?? e.y);
        if (modo === "livre") livreH += dx * 0.25; else olharH += dx * 0.25;
        olharT -= dy * 0.2;
      }
      bloqueios.ultimo = e.action === "end" ? null : { x: e.x, y: e.y };
    }),
    view.on("mouse-wheel", (e) => { if (ativo) e.stopPropagation(); }),
    view.on("double-click", (e) => { if (ativo) e.stopPropagation(); }),
    view.on("key-down", (e) => { if (ativo) e.stopPropagation(); }),
  ];
  const MAPA = { w: "frente", arrowup: "frente", s: "tras", arrowdown: "tras", a: "esq", arrowleft: "esq",
                 d: "dir", arrowright: "dir", q: "ladoE", e: "ladoD", shift: "corre" };
  const teclaBaixo = (e) => {
    if (!ativo || e.target.closest?.("select, input")) return;
    const k = e.key.toLowerCase();
    if (k === " " && modo === "guiado") { definirPausa(!pausa); e.preventDefault(); return; }
    if (k === "escape") { sair(); return; }
    if (MAPA[k]) {
      if (modo === "guiado" && MAPA[k] !== "corre") { sel.value = "livre"; escolher("livre"); }
      teclas.add(MAPA[k]); e.preventDefault();
    }
  };
  const teclaCima = (e) => { const k = MAPA[e.key.toLowerCase()]; if (k) teclas.delete(k); };
  window.addEventListener("keydown", teclaBaixo, true);
  window.addEventListener("keyup", teclaCima, true);
  window.addEventListener("blur", () => teclas.clear());
  for (const b of $("pasPad").querySelectorAll("button")) {
    const k = b.dataset.k;
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try { b.setPointerCapture(e.pointerId); } catch { /* ponteiro sintético ou já libertado */ }
      teclas.add(k);
    });
    b.addEventListener("contextmenu", (e) => e.preventDefault()); // toque longo no celular não abre menu
    for (const ev of ["pointerup", "pointercancel"]) b.addEventListener(ev, () => teclas.delete(k));
  }
  // dedo levantado fora do botão: larga todos os botões do painel (as teclas do teclado continuam)
  const PAD = ["frente", "tras", "esq", "dir", "ladoE", "ladoD"];
  for (const ev of ["pointerup", "pointercancel"]) window.addEventListener(ev, (e) => {
    if (!e.target.closest?.("#pasPad")) PAD.forEach((k) => teclas.delete(k));
  });

  function entrar() {
    if (ativo) return;
    camAntes = view.camera.clone();
    // Por omissão o SDK mantém a câmara a ~5 m do chão ("stay-above", medido: 1,65 pedido -> 5,0 obtido).
    // Durante o passeio a altura é controlada aqui (nunca abaixo de 1,2 m do chão); à saída repõe-se.
    restricaoAntes = view.map.ground.navigationConstraint?.clone?.() ?? null;
    view.map.ground.navigationConstraint = { type: "none" };
    ativo = true;
    painel.hidden = false;
    document.body.classList.add("passeio-ativo");
    btn?.setAttribute("aria-expanded", "true");
    escolher(sel.value);
    tAnt = 0; quadros = 0; t0quadros = performance.now();
    raf = requestAnimationFrame(quadro);
  }
  function sair() {
    if (!ativo) return;
    ativo = false;
    cancelAnimationFrame(raf);
    painel.hidden = true;
    document.body.classList.remove("passeio-ativo");
    btn?.setAttribute("aria-expanded", "false");
    teclas.clear();
    view.map.ground.navigationConstraint = restricaoAntes ?? { type: "stay-above" };
    if (camAntes) view.goTo(camAntes, { duration: 1500 }).catch(() => { view.camera = camAntes; });
    (btn ?? document.querySelector('#corpo tr[data-passeio]'))?.focus();
  }

  btn?.addEventListener("click", () => (ativo ? sair() : entrar()));
  $("pasSair").addEventListener("click", sair);
  sel.addEventListener("change", () => escolher(sel.value));
  play.addEventListener("click", () => {
    if (pausa && pc.L - s < 0.5) { s = 0; zOlho = null; }
    definirPausa(!pausa);
  });
  velSel.addEventListener("change", () => { fator = Number(velSel.value); });
  prog.addEventListener("input", () => { s = (Number(prog.value) / 1000) * pc.L; zOlho = null; });

  definirPausa(false);
  // para a casca (separador Paseos) e para testes e medição: window.passeio
  return {
    entrar, sair,
    escolher: (id) => { sel.value = id; escolher(id); },
    velocidade: (f) => { fator = f; velSel.value = String(f); },
    pausa: definirPausa,
    ir: (frac) => { s = frac * pc.L; zOlho = null; },
    estado: () => ({ ativo, modo, percurso: pc.id, s: Math.round(s), L: Math.round(pc.L), pausa,
                     camara: view.camera.position && { x: Math.round(view.camera.position.x), y: Math.round(view.camera.position.y),
                       z: Math.round(view.camera.position.z * 100) / 100 } }),
    // fps desde a última chamada (só conta quadros do passeio)
    fps: () => { const t = performance.now(), r = Math.round(quadros / ((t - t0quadros) / 1000)); quadros = 0; t0quadros = t; return { fps: r, hidden: document.hidden, px: `${innerWidth}x${innerHeight}` }; },
    chao: (x, y) => chao(x, y, null),
    percursos: percursos.map((p) => ({ id: p.id, nome: p.nome, L: Math.round(p.L) })),
    info: dados.info,
  };
}
