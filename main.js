// Visor local do gêmeo digital do Retiro. Cena em ETRS89 / UTM 30N (EPSG:25830), modo local.
// A interface (casca "papel", web/casca.js) desenha-se antes; no fim este ficheiro regista o gêmeo nela.
import { t, poeTexto, locale } from "./i18n.js";
import { casca } from "./casca.js";
const [Map, SceneView, Graphic, GraphicsLayer, FeatureLayer, Mesh, Point, Polygon, BaseTileLayer, BaseElevationLayer, TileInfo, Basemap, Ground] = await Promise.all([
  $arcgis.import("@arcgis/core/Map.js"),
  $arcgis.import("@arcgis/core/views/SceneView.js"),
  $arcgis.import("@arcgis/core/Graphic.js"),
  $arcgis.import("@arcgis/core/layers/GraphicsLayer.js"),
  $arcgis.import("@arcgis/core/layers/FeatureLayer.js"),
  $arcgis.import("@arcgis/core/geometry/Mesh.js"),
  $arcgis.import("@arcgis/core/geometry/Point.js"),
  $arcgis.import("@arcgis/core/geometry/Polygon.js"),
  $arcgis.import("@arcgis/core/layers/BaseTileLayer.js"),
  $arcgis.import("@arcgis/core/layers/BaseElevationLayer.js"),
  $arcgis.import("@arcgis/core/layers/support/TileInfo.js"),
  $arcgis.import("@arcgis/core/Basemap.js"),
  $arcgis.import("@arcgis/core/Ground.js"),
]);

const SR = { wkid: 25830 };
const estado = document.getElementById("estado");
// widgets e popups do SDK no idioma da interface (muda também ao trocar de idioma)
const intl = await $arcgis.import("@arcgis/core/intl.js");
intl.setLocale(locale());
addEventListener("retiro:idioma", () => intl.setLocale(locale()));
const manifest = await (await fetch("data/manifest.json", { cache: "no-store" })).json();
const V = `?v=${manifest.versao ?? 0}`; // evita que o navegador sirva modelos antigos depois de reexportar
const [OX, OY, OZ] = manifest.origin;

const VISTAS = {
  parque:    { position: { x: 441830, y: 4472700, z: 1750 }, heading: 8,   tilt: 48 },
  estanque:  { position: { x: 441640, y: 4473990, z: 900 },  heading: 48,  tilt: 58 },
  monumento: { position: { x: 441935, y: 4474262, z: 687 },  heading: 71,  tilt: 80 },
  passeio:   { position: { x: 441886, y: 4474318, z: 668.4 }, heading: 96, tilt: 91 },
  cristal:   { position: { x: 442212, y: 4473926, z: 664.5 }, heading: 243, tilt: 88 },
  velazquez: { position: { x: 442104, y: 4474128, z: 668.5 }, heading: 151, tilt: 86 },
  rosaleda:  { position: { x: 442330, y: 4473445, z: 760 }, heading: 338, tilt: 52 },
  parterre:  { position: { x: 441540, y: 4474020, z: 715 }, heading: 62, tilt: 62 },
  estatuas:  { position: { x: 441545, y: 4474228, z: 700 }, heading: 86, tilt: 70 },
  vacas:     { position: { x: 441880, y: 4474560, z: 705 }, heading: 120, tilt: 66 },
  cecilio:   { position: { x: 442535, y: 4473722, z: 742 }, heading: 343, tilt: 58 },
  independencia: { position: { x: 441611, y: 4474579, z: 665.3 }, heading: 118, tilt: 84 },
  angel:     { position: { x: 442064, y: 4473590, z: 670 }, heading: 60, tilt: 86 },
  mobilidade: { position: { x: 442077, y: 4472180, z: 2690 }, heading: 0, tilt: 40 }, // parque e envolvente, do sul
};
const camara = (v) => ({ ...v, position: { ...v.position, spatialReference: SR } });

// ---- chão: mosaicos com níveis de detalhe (relevo + imagem) ou, com ?terreno=glb, as malhas GLB antigas
const params = new URLSearchParams(location.search);
let tiles = null;
if (params.get("terreno") !== "glb") {
  try {
    const r = await fetch("data/tiles/tiles.json" + V);
    if (r.ok) tiles = await r.json();
  } catch { tiles = null; }
}
const base = new URL("data/tiles/", location.href).href;
let map;
if (tiles) {
  const tileInfo = (max) => new TileInfo({
    size: [tiles.tamanho, tiles.tamanho], dpi: 96, format: "jpg", spatialReference: SR,
    origin: { x: tiles.origem[0], y: tiles.origem[1], spatialReference: SR },
    lods: tiles.resolucoes.slice(0, max + 1).map((res, level) => ({ level, resolution: res, scale: res * 96 * 39.37007874 })),
  });
  const [xmin, ymin, xmax, ymax] = tiles.extensao;
  const fullExtent = { xmin, ymin, xmax, ymax, spatialReference: SR };
  const n7 = new Set(tiles.nivel7);
  const T = tiles.tamanho;
  const PQ = tiles.extensao_parque ?? tiles.extensao;
  // Nem todos os níveis existem em todo o lado: o detalhe fino só cobre o parque (e o nível 7 só as zonas).
  // Quando falta um mosaico, pede-se o antepassado que existe e recorta-se a parte correspondente.
  const toca = (level, row, col) => {
    const lado = T * tiles.resolucoes[level];
    const x0 = tiles.origem[0] + col * lado, y1 = tiles.origem[1] - row * lado;
    return !(x0 + lado <= PQ[0] || x0 >= PQ[2] || y1 - lado >= PQ[3] || y1 <= PQ[1]);
  };
  const existeImg = (l, r, c) => l <= (tiles.imagem_base ?? 6) || (l === 7 ? n7.has(`${r}_${c}`) : toca(l, r, c));
  const existeRel = (l, r, c) => l <= (tiles.relevo_base ?? 5) || toca(l, r, c);
  const fonte = (existe, level, row, col) => {
    let f = level;
    while (f > 0 && !existe(f, row >> (level - f), col >> (level - f))) f--;
    return f;
  };
  const carregarImagem = (url, signal) => new Promise((ok, erro) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => erro(new Error("mosaico em falta: " + url));
    signal?.addEventListener("abort", () => { im.src = ""; erro(new DOMException("Aborted", "AbortError")); });
    im.src = url;
  });
  class Orto extends BaseTileLayer {
    constructor(props) { super(props); this.tileInfo = tileInfo(tiles.imagem_max); this.fullExtent = fullExtent; this.spatialReference = SR; }
    async fetchTile(level, row, col, options) {
      const f = fonte(existeImg, level, row, col), k = level - f, n = 1 << k;
      const im = await carregarImagem(`${base}orto/${f}/${row >> k}/${col >> k}.jpg${V}`, options?.signal);
      if (!k) return im;
      const cv = document.createElement("canvas");
      cv.width = cv.height = T;
      const w = T / n;
      cv.getContext("2d").drawImage(im, (col % n) * w, (row % n) * w, w, w, 0, 0, T, T);
      return cv;
    }
  }
  const orto = new Orto({ title: "Ortofoto e solo" });
  class Relevo extends BaseElevationLayer {
    constructor(props) { super(props); this.tileInfo = tileInfo(tiles.relevo_max); this.fullExtent = fullExtent; this.spatialReference = SR; }
    async fetchTile(level, row, col, options) {
      const f = fonte(existeRel, level, row, col), k = level - f, n = 1 << k, N = T + 1;
      const r = await fetch(`${base}relevo/${f}/${row >> k}/${col >> k}.bin${V}`, { signal: options?.signal });
      if (!r.ok) throw new Error("mosaico de relevo em falta");
      const q = new Uint16Array(await r.arrayBuffer());
      const values = new Float32Array(N * N);
      const esc = tiles.relevo.escala, off = tiles.relevo.offset;
      if (!k) {
        for (let i = 0; i < q.length; i++) values[i] = q[i] / esc + off;
      } else {                                   // parte do mosaico-pai, com interpolação bilinear
        const c0 = (col % n) * T / n, r0 = (row % n) * T / n;
        for (let jj = 0; jj <= T; jj++) {
          const fy = r0 + jj / n, y0 = Math.min(Math.floor(fy), T - 1), ty = fy - y0;
          for (let ii = 0; ii <= T; ii++) {
            const fx = c0 + ii / n, x0 = Math.min(Math.floor(fx), T - 1), tx = fx - x0;
            const a = q[y0 * N + x0], b = q[y0 * N + x0 + 1], c = q[(y0 + 1) * N + x0], d = q[(y0 + 1) * N + x0 + 1];
            values[jj * N + ii] = ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty) / esc + off;
          }
        }
      }
      return { values, width: N, height: N, noDataValue: -9999 };
    }
  }
  map = new Map({ basemap: new Basemap({ baseLayers: [orto] }), ground: new Ground({ layers: [new Relevo({ title: "Relevo" })] }) });
} else {
  map = new Map({ ground: { opacity: 0, navigationConstraint: { type: "none" } } });
}
window.modoTerreno = tiles ? "mosaicos" : "glb";
const areaVisivel = tiles
  ? { xmin: tiles.extensao[0], ymin: tiles.extensao[1], xmax: tiles.extensao[2], ymax: tiles.extensao[3], spatialReference: SR }
  : { xmin: 441400, ymin: 4473100, xmax: 442800, ymax: 4474900, spatialReference: SR };
const view = new SceneView({
  container: "view",
  map,
  viewingMode: "local",
  spatialReference: SR,
  clippingArea: areaVisivel,
  camera: camara(VISTAS.estanque),
  qualityProfile: "medium",
  environment: {
    background: { type: "color", color: [247, 240, 225, 1] }, // creme do papel fora da área
    atmosphereEnabled: true,
    starsEnabled: false,
    lighting: { type: "sun", date: dataHora(16), directShadowsEnabled: true, ambientOcclusionEnabled: true },
    weather: { type: "sunny", cloudCover: 0.15 },
  },
  // popup em baixo à direita: em cima ficava por baixo das pílulas das vistas
  popup: { dockEnabled: true, dockOptions: { position: "bottom-right", breakpoint: false } },
  constraints: { clipDistance: { mode: "manual", near: 0.5, far: 12000 } },
});
view.ui.move("zoom", "top-left"); // em baixo ficava atrás do popup
view.ui.padding = { top: 78, right: 22, bottom: 22, left: 22 }; // pílulas das vistas em cima; cantos de 40 px
window.view = view; // para inspeção

function dataHora(h) {
  // 15 de maio, hora local de Madrid (UTC+2)
  const d = new Date(Date.UTC(2026, 4, 15, 0, 0, 0));
  d.setUTCMinutes(Math.round((h - 2) * 60));
  return d;
}

// ---- malhas georreferenciadas (GLB em coordenadas locais; origem = manifest.origin)
const origem = new Point({ x: OX, y: OY, z: OZ, spatialReference: SR });
const malhas = new GraphicsLayer({ title: "Modelo", elevationInfo: { mode: "absolute-height" } });
map.add(malhas);

// camadas = todos os GLB listados no manifesto (cada zona nova acrescenta o seu terreno sem tocar neste ficheiro)
const CAMADAS = Object.entries(manifest.layers)
  .filter(([nome, v]) => v && v.file && !(tiles && nome.startsWith("terreno_")))
  .map(([nome]) => [nome, nome.replace(/_/g, " ")]);
const falhas = [];
await Promise.all(CAMADAS.map(async ([nome, titulo]) => {
  try {
    const mesh = await Mesh.createFromGLTF(origem, `data/${nome}.glb${V}`, { vertexSpace: "georeferenced" });
    malhas.add(new Graphic({
      geometry: mesh,
      attributes: { nome: titulo },
      // os jardins em blocos (sebes) são baixos e pesados: sem sombra projetada
      symbol: { type: "mesh-3d", symbolLayers: [{ type: "fill", castShadows: nome !== "sebes" || params.get("sombras") === "todas" }] },
    }));
  } catch (e) {
    console.error("falhou", nome, e);
    falhas.push(titulo);
  }
}));

// ---- água com símbolo animado
const agua = new GraphicsLayer({ title: "Água", elevationInfo: { mode: "absolute-height" } });
for (const a of await (await fetch("data/agua.json" + V)).json()) {
  agua.add(new Graphic({
    geometry: new Polygon({ rings: [a.ring.map(([x, y]) => [x, y, a.z])], hasZ: true, spatialReference: SR }),
    attributes: { nome: a.nome || "Água", cota: a.z },
    symbol: { type: "polygon-3d", symbolLayers: [{ type: "water", waveDirection: 250, color: "#2f5a4c", waveStrength: "slight", waterbodySize: "medium" }] },
    popupTemplate: { title: ({ graphic }) => graphic.attributes.nome || t("pop.agua"), content: ({ graphic }) => t("pop.agua_cota", { cota: graphic.attributes.cota }) },
  }));
}
map.add(agua);

// ---- árvores do inventário municipal: um ponto por árvore, modelo 3D por espécie
const arv = await (await fetch("data/arvores.json" + V)).json();
const idx = Object.fromEntries(arv.fields.map((f, i) => [f, i]));
const modelos = [...new Set(arv.rows.map((r) => r[idx.modelo]))];
const arvores = new FeatureLayer({
  title: "Árvores (inventário 2026)",
  source: arv.rows.map((r, i) => new Graphic({
    geometry: { type: "point", x: r[idx.x], y: r[idx.y], z: r[idx.z], spatialReference: SR },
    attributes: { oid: i + 1, ASSETNUM: r[idx.ASSETNUM], ESPECIE: r[idx.ESPECIE], modelo: r[idx.modelo],
                  ALTURA: r[idx.ALTURA], PERIMETRO: r[idx.PERIMETRO], rot: r[idx.rot], piloto: r[idx.piloto], sombra: 0 },
  })),
  objectIdField: "oid",
  geometryType: "point",
  hasZ: true,
  spatialReference: SR,
  fields: [
    { name: "oid", type: "oid" }, { name: "ASSETNUM", type: "string" }, { name: "ESPECIE", type: "string" },
    { name: "modelo", type: "string" }, { name: "ALTURA", type: "double" }, { name: "PERIMETRO", type: "double" },
    { name: "rot", type: "double" }, { name: "piloto", type: "integer" }, { name: "sombra", type: "integer" },
  ],
  outFields: ["*"],
  elevationInfo: { mode: "absolute-height" },
  renderer: {
    type: "unique-value",
    // símbolo = modelo da espécie + se projeta sombra. A sombra é decidida pela distância à câmara (ver
    // atualizarSombras): era o que mais custava (27 -> 59 fps sem sombras) e por zona crescia a cada zona nova.
    valueExpression: "$feature.modelo + '|' + $feature.sombra",
    uniqueValueInfos: modelos.flatMap((m) => [0, 1].map((sombra) => ({
      value: `${m}|${sombra}`,
      symbol: { type: "point-3d", symbolLayers: [{ type: "object", resource: { href: `data/arvores/${m}.glb${V}` }, anchor: "origin", height: 10,
                castShadows: sombra === 1 }] },
    }))),
    visualVariables: [
      { type: "size", axis: "height", field: "ALTURA", valueUnit: "meters" },
      { type: "rotation", field: "rot", rotationType: "geographic" },
    ],
  },
  popupTemplate: {
    title: "{ESPECIE}",
    outFields: ["*"],
    content: ({ graphic: { attributes: a } }) => tabelaPopup([["pop.arv_altura", a.ALTURA], ["pop.arv_perimetro", a.PERIMETRO], ["pop.arv_inv", a.ASSETNUM]]),
  },
});
map.add(arvores);
// O SDK limita os elementos desenhados por camada (4 744 com qualidade "medium"): sem isto só aparecia
// cerca de um quarto das árvores. ?arvores=N permite testar outros tetos.
const tetoArvores = Number(params.get("arvores")) || 20000;
view.whenLayerView(arvores).then((lv) => {
  lv.maximumNumberOfFeatures = tetoArvores;
  window.arvoresLV = lv;
});

// ---- sombras por distância: só as árvores a menos de RAIO_SOMBRA do ponto para onde a câmara olha projetam sombra
const RAIO_SOMBRA = Number(params.get("raioSombra")) || 170;
const arvXY = arv.rows.map((r) => [r[idx.x], r[idx.y]]);
const comSombra = new Uint8Array(arv.rows.length);
let aAtualizar = false;
async function atualizarSombras() {
  if (aAtualizar) return;
  const todas = params.get("sombras") === "todas";
  // foco: o chão no centro do ecrã; se a câmara olhar para o céu, o ponto por baixo dela
  let foco = null;
  try { foco = view.toMap({ x: view.width / 2, y: view.height * 0.6 }); } catch { foco = null; }
  const fx = foco ? foco.x : view.camera.position.x;
  const fy = foco ? foco.y : view.camera.position.y;
  const r2 = RAIO_SOMBRA * RAIO_SOMBRA;
  const mudar = [];
  for (let i = 0; i < arvXY.length; i++) {
    const dx = arvXY[i][0] - fx, dy = arvXY[i][1] - fy;
    const quer = todas || dx * dx + dy * dy < r2 ? 1 : 0;
    if (quer !== comSombra[i]) { comSombra[i] = quer; mudar.push(new Graphic({ attributes: { oid: i + 1, sombra: quer } })); }
  }
  if (!mudar.length) return;
  aAtualizar = true;
  try { await arvores.applyEdits({ updateFeatures: mudar }); } catch (e) { console.error("sombras", e); }
  aAtualizar = false;
  window.sombrasInfo = { raio: RAIO_SOMBRA, comSombra: comSombra.reduce((a, b) => a + b, 0), alteradas: mudar.length };
}
window.atualizarSombras = atualizarSombras;

// conteúdo de popup: tabela de rótulo (traduzido na hora de abrir) e valor
function tabelaPopup(linhas) {
  const tab = document.createElement("table");
  tab.className = "pop-tab";
  for (const [k, v, cls] of linhas) {
    if (v == null || v === "") continue;
    const tr = tab.insertRow(), th = document.createElement("th"), td = tr.insertCell();
    th.textContent = t(k); tr.prepend(th);
    td.textContent = typeof v === "number" ? v.toLocaleString(locale()) : v;
    if (cls) td.className = cls;
  }
  return tab;
}
window.tabelaPopup = tabelaPopup;

// ---- arte pública: marcadores com dados
const arteDados = await (await fetch("data/arte_publico.json" + V)).json();
const arte = new FeatureLayer({
  title: "Arte pública",
  source: arteDados.map((a, i) => new Graphic({
    geometry: { type: "point", x: a.x, y: a.y, z: a.z, spatialReference: SR },
    attributes: { oid: i + 1, titulo: a.titulo, autor: a.autor, ano: a.ano, tipo: a.tipo },
  })),
  objectIdField: "oid",
  geometryType: "point",
  hasZ: true,
  spatialReference: SR,
  fields: [
    { name: "oid", type: "oid" }, { name: "titulo", type: "string" }, { name: "autor", type: "string" },
    { name: "ano", type: "double" }, { name: "tipo", type: "string" },
  ],
  outFields: ["*"],
  elevationInfo: { mode: "absolute-height" },
  renderer: {
    type: "simple",
    symbol: {
      type: "point-3d",
      symbolLayers: [{ type: "icon", resource: { primitive: "circle" }, material: { color: "#fcbd1c" }, outline: { color: "#23212c", size: 1 }, size: 9 }],
      verticalOffset: { screenLength: 36, maxWorldLength: 60, minWorldLength: 6 },
      callout: { type: "line", size: 1, color: [35, 33, 44, 0.7] },
    },
  },
  labelingInfo: [{
    labelExpressionInfo: { expression: "$feature.titulo" },
    symbol: { type: "label-3d", symbolLayers: [{ type: "text", material: { color: "#23212c" }, halo: { color: [247, 240, 225, 0.92], size: 1.6 }, size: 9 }] },
    maxScale: 0, minScale: 2500,
  }],
  popupTemplate: { title: "{titulo}", content: "{tipo} · {autor} · {ano}" },
});
map.add(arte);

// ---- interface
await view.when();
const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");
reactiveUtils.when(() => view.stationary, () => atualizarSombras(), { initial: true });

// ---- limites de navegação: o ponto para onde se olha não sai do parque (com folga) e a câmara não sobe demais
const LIM = tiles?.extensao_parque ?? [441530, 4473262, 442624, 4474790];
const FOLGA = 120, Z_MAX = 2700;
let aCorrigir = false;
async function manterNoParque() {
  if (aCorrigir || params.get("livre") !== null) return;
  const cam = view.camera.clone();
  let foco = null;
  try { foco = view.toMap({ x: view.width / 2, y: view.height / 2 }); } catch { foco = null; }
  const fx = foco ? foco.x : cam.position.x, fy = foco ? foco.y : cam.position.y;
  const dx = Math.min(Math.max(fx, LIM[0] - FOLGA), LIM[2] + FOLGA) - fx;
  const dy = Math.min(Math.max(fy, LIM[1] - FOLGA), LIM[3] + FOLGA) - fy;
  const dz = cam.position.z > Z_MAX ? Z_MAX - cam.position.z : 0;
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && !dz) return;
  cam.position.x += dx; cam.position.y += dy; cam.position.z += dz;
  aCorrigir = true;
  try { await view.goTo(cam, { duration: 600 }); } catch { /* interrompido pelo utilizador */ }
  aCorrigir = false;
}
reactiveUtils.when(() => view.stationary, manterNoParque);
window.manterNoParque = manterNoParque;
if (falhas.length) poeTexto(estado, "est.falhou", { lista: falhas.join(", ") });
else poeTexto(estado, "est.pronto", { arv: arv.rows.length, arte: arteDados.length });

let ativos = null; // camadas de ativos (luminárias e sensores); null se desligadas ou se o módulo falhar
let horaAtual = 16;
const irVista = (nome) => VISTAS[nome] && view.goTo(camara(VISTAS[nome]), { duration: 2200 }).catch(() => {});

// ---- medição: fps com a câmara a rodar devagar (obriga a redesenhar todos os frames)
// uso: await window.medirVista("cristal")  ->  { fps, hidden }
window.medirVista = async (nome, ms = 4000) => {
  const alvo = camara(VISTAS[nome]);
  await view.goTo(alvo, { animate: false });
  const t1 = performance.now();
  while (view.updating && performance.now() - t1 < 15000) await new Promise((o) => setTimeout(o, 250));
  await atualizarSombras();
  await new Promise((o) => setTimeout(o, 1500));
  const t2 = performance.now();
  while (view.updating && performance.now() - t2 < 10000) await new Promise((o) => setTimeout(o, 250));
  const h0 = view.camera.heading;
  let n = 0;
  const t0 = performance.now();
  await new Promise((ok) => {
    const tick = () => {
      n++;
      const cam = view.camera.clone();
      cam.heading = h0 + Math.sin((performance.now() - t0) / 700) * 1.5;
      view.camera = cam;
      (performance.now() - t0 < ms) ? requestAnimationFrame(tick) : ok();
    };
    requestAnimationFrame(tick);
  });
  const fps = Math.round(n / ((performance.now() - t0) / 1000));
  await view.goTo(alvo, { animate: false });
  return { vista: nome, fps, hidden: document.hidden, px: `${innerWidth}x${innerHeight}` };
};
window.camadas = { arvores, arte, agua, malhas };

// ---- ativos com estado (luminárias e sensores): o gêmeo só lê as camadas cujo endereço está em config.js.
// Carregado no fim e dentro de try: se o servidor de ativos estiver desligado, o visor fica como estava.
// A interface fala com o gêmeo só através destas funções (web/casca.js).
casca.registar("gemeo", {
  irVista,
  definirHora(h) { horaAtual = h; view.environment.lighting.date = dataHora(h); ativos?.definirHora(h); },
  sombras(v) { view.environment.lighting.directShadowsEnabled = v; },
  irPonto(x, y) { view.goTo({ target: new Point({ x, y, spatialReference: SR }), scale: 2200, tilt: 58 }, { duration: 1800 }).catch(() => {}); },
  irPara(pts) { view.goTo({ target: pts.map(([x, y, z]) => new Point({ x, y, z, spatialReference: SR })), tilt: 55 }, { duration: 2000 }).catch(() => {}); },
  camadas: { arvores, arte, agua, malhas },
  contagens: { arvores: arv.rows.length, arte: arteDados.length },
});

try {
  const { iniciarAtivos } = await import("./ativos-gemeo.js");
  ativos = await iniciarAtivos({ view, map, SR, Graphic, GraphicsLayer, FeatureLayer, Mesh });
  ativos?.definirHora(horaAtual);
  window.ativos = ativos;
  casca.registar("ativos", ativos);
} catch (e) {
  console.error("ativos", e);
  poeTexto(document.getElementById("ativosEstado"), "atv.falhou");
}

// ---- mobilidade para chegar ao parque (paragens, estações, BiciMAD, portas): dados estáticos em data/mobilidade/.
// Também no fim e dentro de try; as camadas só são criadas quando a secção é ligada.
try {
  const { iniciarMobilidade } = await import("./mobilidade.js");
  window.mobilidade = await iniciarMobilidade({ view, map, SR, Graphic, GraphicsLayer, FeatureLayer });
  casca.registar("mobilidade", window.mobilidade);
} catch (e) {
  console.error("mobilidade", e);
  const el = document.getElementById("mobEstado");
  if (el) { el.hidden = false; poeTexto(el, "mob.falhou"); }
}

// ---- modo passeio: câmara à altura dos olhos ao longo dos caminhos reais (data/passeio/), ou a andar livre.
// Também no fim e dentro de try: sem os percursos, o botão fica escondido e o visor continua como estava.
try {
  const { iniciarPasseio } = await import("./passeio.js");
  window.passeio = await iniciarPasseio({ view, SR });
  casca.registar("passeio", window.passeio);
} catch (e) {
  console.error("passeio", e);
  casca.registar("passeio", null);
}
