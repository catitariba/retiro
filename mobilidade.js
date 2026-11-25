// Mobilidade para chegar ao parque: paragens, estações, BiciMAD, táxis, estacionamentos, traçados e as 23 portas.
// Dados estáticos preparados por scripts/mobilidade_prepare.py em data/mobilidade/ (EPSG:25830). As camadas só são
// criadas quando a secção é ligada pela primeira vez: desligada, não custa nada ao visor.
// "Porta mais próxima" e os minutos a pé são ESTIMATIVAS em linha reta, não rotas.
// Único pedido para fora: a disponibilidade do BiciMAD (GBFS público, sem chave), só ao abrir o popup de uma estação.
import { BICIMAD_GBFS } from "./config.js";
import { t, dado, locale, poeTexto } from "./i18n.js";

const PASTA = "data/mobilidade/";
const GRUPOS = ["autocarro", "metro", "cercanias", "bicimad", "outros"];
const GRUPO_DE = { autocarro: "autocarro", metro: "metro", cercanias: "cercanias", bicimad: "bicimad",
  interurbano: "outros", taxi: "outros", estacionamento: "outros", aparcabicis: "outros", ciclovia: "outros" };
const NOME_MODO = (m) => dado("mobModo", m);
// camadas de pontos: [modo, tipo, letra, cor do fundo, cor da letra, tamanho, escala mínima (0 = sempre), rótulo, escala do rótulo]
const PONTOS = [
  ["metro", "estação", "M", "#e0292f", "#fff", 24, 0, "$feature.rotulo + ' · L' + Replace($feature.linhas, ', ', ' L')", 0],
  ["metro", "acesso", "", "#e0292f", "#fff", 9, 7000, null, 0],
  ["cercanias", "estação", "C", "#c2185b", "#fff", 24, 0, "$feature.rotulo + ' · ' + $feature.linhas", 0],
  ["cercanias", "acesso", "", "#c2185b", "#fff", 9, 7000, null, 0],
  ["autocarro", "paragem", "B", "#2f7fd6", "#fff", 15, 0, "$feature.linhas", 3500],
  ["bicimad", "estação", "b", "#19b5a5", "#06221f", 17, 0, "$feature.rotulo", 3500],
  ["interurbano", "paragem", "I", "#3aa655", "#fff", 15, 0, "$feature.linhas", 3500],
  ["taxi", "praça de táxis", "T", "#f2f2f2", "#111", 15, 0, null, 0],
  ["estacionamento", "parque de estacionamento", "P", "#3d5afe", "#fff", 17, 0, "$feature.rotulo", 3500],
  ["aparcabicis", "aparcamento de bicicletas", "", "#8bc34a", "#fff", 8, 6000, null, 0],
];

function distintivo(letra, fundo, cor) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.beginPath();
  g.arc(32, 32, 28, 0, 2 * Math.PI);
  g.fillStyle = fundo;
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = "#23212c";
  g.stroke();
  if (letra) {
    g.fillStyle = cor;
    g.font = "bold 38px 'Segoe UI', system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(letra, 32, 35);
  }
  return c.toDataURL("image/png");
}
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

export async function iniciarMobilidade({ view, map, SR, Graphic, GraphicsLayer, FeatureLayer }) {
  const params = new URLSearchParams(location.search);
  const caixa = document.getElementById("mobOn"), sub = document.getElementById("mobModos"), estadoEl = document.getElementById("mobEstado");
  const dizer = (chave, vars) => poeTexto(estadoEl, chave, vars);
  const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");
  const camadas = Object.fromEntries(GRUPOS.map((g) => [g, []]));   // grupo -> camadas do mapa
  let portas = null, destaque = null, dados = null, aCriar = null;
  const ligados = Object.fromEntries(GRUPOS.map((g) => [g, true]));
  let ligado = false;

  // ---- BiciMAD em tempo real: só quando se abre o popup de uma estação; resposta guardada 30 s
  let bici = { quando: 0, mapa: null };
  async function estadoBici(id) {
    if (!BICIMAD_GBFS) return null;
    if (!bici.mapa || performance.now() - bici.quando > 30000) {
      const d = await (await fetch(BICIMAD_GBFS, { cache: "no-store" })).json();
      bici = { quando: performance.now(), mapa: new Map(d.data.stations.map((s) => [String(s.station_id), s])) };
    }
    return bici.mapa.get(String(id)) ?? null;
  }

  async function conteudo({ graphic }) {
    const a = graphic.attributes, el = document.createElement("div");
    el.className = "pop";
    el.innerHTML =
      `<p>${esc(NOME_MODO(a.modo))} · ${esc(dado("texto", a.tipo))}${a.linhas ? `<br>${esc(t("pop.linhas"))}: <b>${esc(a.linhas)}</b>` : ""}` +
      `${a.info ? `<br>${esc(dado("texto", a.info))}` : ""}</p>` +
      `<p>${esc(t("pop.porta_perto"))}: <b>${esc(dado("texto", a.porta))}</b><br>${esc(t("pop.porta_dist", { m: a.porta_m, min: a.porta_min }))} ` +
      `<span class="tenue">${esc(t("pop.estimativa"))}</span></p>`;
    if (a.modo === "bicimad") {
      const p = document.createElement("p");
      p.style.margin = "0";
      p.textContent = BICIMAD_GBFS ? t("pop.bici_ler") : t("pop.bici_off");
      el.append(p);
      if (BICIMAD_GBFS) {
        try {
          const s = await estadoBici(a.gbfs);
          p.innerHTML = s
            ? t("pop.bici_agora", { b: s.num_bikes_available, d: s.num_docks_available }) +
              `${s.status && s.status !== "IN_SERVICE" ? esc(t("pop.bici_estado", { s: s.status })) : ""}<br><span class="tenue">` +
              esc(t("pop.bici_lido", { h: new Date((s.last_reported || 0) * 1000).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }) })) + "</span>"
            : esc(t("pop.bici_sem"));
        } catch { p.textContent = t("pop.bici_erro"); }
      }
    }
    return el;
  }

  function criarPontos([modo, tipo, letra, fundo, cor, tam, minScale, rotulo, escRotulo], feats) {
    const sel = feats.filter((f) => f.properties.modo === modo && f.properties.tipo === tipo);
    if (!sel.length) return null;
    return new FeatureLayer({
      title: `Mobilidade · ${modo} (${tipo})`,
      source: sel.map((f, i) => new Graphic({
        geometry: { type: "point", x: f.geometry.coordinates[0], y: f.geometry.coordinates[1], spatialReference: SR },
        attributes: { oid: i + 1, ...f.properties, rotulo: dado("texto", f.properties.nome) },
      })),
      objectIdField: "oid", geometryType: "point", spatialReference: SR,
      fields: [{ name: "oid", type: "oid" }, ...["id", "modo", "tipo", "nome", "rotulo", "linhas", "info", "porta", "porta_id", "gbfs"].map((name) => ({ name, type: "string" })),
        ...["porta_m", "porta_min", "visor"].map((name) => ({ name, type: "integer" })), { name: "de_x", type: "double" }, { name: "de_y", type: "double" }],
      outFields: ["*"],
      minScale,
      elevationInfo: { mode: "relative-to-ground", offset: 0 },
      renderer: { type: "simple", symbol: {
        type: "point-3d",
        symbolLayers: [{ type: "icon", resource: { href: distintivo(letra, fundo, cor) }, size: tam }],
        verticalOffset: { screenLength: tam > 20 ? 44 : tam > 12 ? 22 : 10, maxWorldLength: 90, minWorldLength: 3 },
        callout: { type: "line", size: tam > 20 ? 1.5 : 1, color: fundo },
      } },
      labelingInfo: rotulo ? [{
        labelExpressionInfo: { expression: rotulo },
        symbol: { type: "label-3d", symbolLayers: [{ type: "text", material: { color: "#23212c" }, halo: { color: [247, 240, 225, 0.92], size: 1.6 }, size: tam > 20 ? 11 : 9 }] },
        minScale: escRotulo,
      }] : [],
      popupTemplate: { title: ({ graphic }) => dado("texto", graphic.attributes.nome), outFields: ["*"], content: conteudo },
    });
  }

  function criarLinhas(grupo, feats) {
    const sel = feats.filter((f) => GRUPO_DE[f.properties.modo] === grupo);
    if (!sel.length) return null;
    const gl = new GraphicsLayer({ title: `Mobilidade · traçados (${grupo})`, elevationInfo: { mode: "on-the-ground" } });
    for (const f of sel) {
      const p = f.properties, ferro = p.modo === "metro" || p.modo === "cercanias", ciclo = p.modo === "ciclovia";
      gl.add(new Graphic({
        geometry: { type: "polyline", paths: f.geometry.coordinates, spatialReference: SR },
        attributes: { linha: p.linha, modo: p.modo },
        // metro e Cercanías passam em túnel: tracejado, para não se ler como via à superfície
        symbol: { type: "simple-line", color: p.cor, width: ferro ? 4 : ciclo ? 2.5 : 2, style: ferro ? "short-dash" : ciclo ? "short-dot" : "solid" },
        popupTemplate: {
          title: () => (ciclo ? t("pop.ciclovia", { l: p.linha }) : t("pop.linha", { modo: NOME_MODO(p.modo), l: p.linha })),
          content: () => t(ferro ? "pop.tunel" : ciclo ? "pop.osm" : "pop.itinerario"),
        },
      }));
    }
    gl.opacity = grupo === "autocarro" ? 0.75 : 0.95;
    return gl;
  }

  async function criar() {
    dizer("mob.carregar");
    const resumo = await (await fetch(PASTA + "resumo.json", { cache: "no-store" })).json();
    const v = `?v=${encodeURIComponent(resumo.gerado)}`;
    const [pt, li, po] = await Promise.all(["pontos", "linhas", "portas"].map(async (n) => (await (await fetch(`${PASTA}${n}.geojson${v}`)).json()).features));
    dados = { resumo, pontos: pt, portas: po };
    for (const g of GRUPOS) { const c = criarLinhas(g, li); if (c) camadas[g].push(c); }
    for (const def of PONTOS) { const c = criarPontos(def, pt); if (c) camadas[GRUPO_DE[def[0]]].push(c); }
    portas = new FeatureLayer({
      title: "Mobilidade · portas do parque",
      source: po.map((f, i) => new Graphic({
        geometry: { type: "point", x: f.geometry.coordinates[0], y: f.geometry.coordinates[1], spatialReference: SR },
        attributes: { oid: i + 1, ...f.properties, rotulo: dado("texto", f.properties.nome) },
      })),
      objectIdField: "oid", geometryType: "point", spatialReference: SR,
      fields: [{ name: "oid", type: "oid" }, ...["id", "nome", "rotulo", "metro", "cercanias", "autocarro", "autocarro_perto", "bicimad", "taxi", "estacionamento"].map((name) => ({ name, type: "string" })),
        ...["monumental", "metro_m", "cercanias_m"].map((name) => ({ name, type: "integer" }))],
      outFields: ["*"],
      elevationInfo: { mode: "relative-to-ground", offset: 0 },
      renderer: { type: "simple", symbol: {
        type: "point-3d",
        symbolLayers: [{ type: "icon", resource: { primitive: "square" }, material: { color: "#006434" }, outline: { color: "#ffffff", size: 1.5 }, size: 11 }],
        verticalOffset: { screenLength: 30, maxWorldLength: 70, minWorldLength: 5 },
        callout: { type: "line", size: 1.5, color: "#006434" },
      } },
      labelingInfo: [{
        labelExpressionInfo: { expression: "$feature.rotulo" },
        symbol: { type: "label-3d", symbolLayers: [{ type: "text", material: { color: "#006434" }, halo: { color: [247, 240, 225, 0.95], size: 1.8 }, size: 10, font: { weight: "bold" } }] },
      }],
      popupTemplate: {
        title: ({ graphic }) => dado("texto", graphic.attributes.nome),
        content: ({ graphic }) => {
          const a = graphic.attributes, el = document.createElement("div");
          el.className = "pop";
          el.innerHTML = `<p>${esc(t("pop.porta_intro"))}</p>` +
            [["pop.p_metro", a.metro], ["pop.p_cercanias", a.cercanias], ["pop.p_bus", a.autocarro], ["pop.p_paragem", a.autocarro_perto],
              ["pop.p_bici", a.bicimad], ["pop.p_taxi", a.taxi], ["pop.p_estac", a.estacionamento]]
              .map(([k, v]) => `<p style="margin:0 0 3px"><b>${esc(t(k))}:</b> ${esc(dado("texto", v))}</p>`).join("");
          return el;
        },
      },
    });
    // ligação à porta do elemento selecionado: linha no chão + realce (desenhados só enquanto o popup está aberto)
    destaque = new GraphicsLayer({ title: "Mobilidade · ligação à porta", elevationInfo: { mode: "on-the-ground" }, listMode: "hide" });
    map.addMany([...GRUPOS.flatMap((g) => camadas[g]), destaque, portas]);
    // ao mudar de idioma, refazer os rótulos que mudam (poucos: portas sem nome, "Estacionamento"…)
    addEventListener("retiro:idioma", async () => {
      for (const c of [...GRUPOS.flatMap((g) => camadas[g]), portas]) {
        if (c.type !== "feature") continue;
        const { features } = await c.queryFeatures({ where: "1=1", outFields: ["oid", "nome", "rotulo"], returnGeometry: false });
        const mudar = features.filter((f) => dado("texto", f.attributes.nome) !== f.attributes.rotulo)
          .map((f) => new Graphic({ attributes: { oid: f.attributes.oid, rotulo: dado("texto", f.attributes.nome) } }));
        if (mudar.length) await c.applyEdits({ updateFeatures: mudar });
      }
    });
    const xyPorta = new Map(po.map((f) => [f.properties.id, f.geometry.coordinates]));
    reactiveUtils.watch(() => [view.popup?.visible, view.popup?.selectedFeature], ([vis, f]) => {
      destaque.removeAll();
      const a = f?.attributes, alvo = a && xyPorta.get(a.porta_id);
      if (!vis || !alvo || a.de_x == null) return;
      destaque.add(new Graphic({
        geometry: { type: "polyline", paths: [[[a.de_x, a.de_y], alvo]], spatialReference: SR },
        symbol: { type: "simple-line", color: "#fcbd1c", width: 5, style: "short-dash" },
      }));
      destaque.add(new Graphic({
        geometry: { type: "point", x: alvo[0], y: alvo[1], spatialReference: SR },
        symbol: { type: "simple-marker", style: "circle", size: 22, color: [252, 189, 28, 0.25], outline: { color: "#fcbd1c", width: 3 } },
      }));
    });
    const c = resumo.pontos;
    dizer("mob.estado", { bus: c["autocarro / paragem"] ?? 0, metro: c["metro / estação"] ?? 0, cerc: c["cercanias / estação"] ?? 0,
      bici: c["bicimad / estação"] ?? 0, portas: resumo.portas });
  }

  async function aplicar() {
    if (ligado && !dados) {
      aCriar ??= criar();
      try { await aCriar; } catch (e) { aCriar = null; ligado = false; if (caixa) caixa.checked = false; dizer("mob.falhou_dados"); console.error("mobilidade", e); }
    }
    if (sub) sub.hidden = !ligado;
    if (estadoEl) estadoEl.hidden = !ligado;
    if (!dados) return;
    for (const g of GRUPOS) for (const c of camadas[g]) c.visible = ligado && ligados[g];
    portas.visible = destaque.visible = ligado;
    if (!ligado) view.popup?.close?.();
  }

  const api = {
    async ligar(v) { ligado = !!v; if (caixa) caixa.checked = ligado; await aplicar(); },
    async modo(g, v) { ligados[g] = !!v; await aplicar(); },
    info: () => ({ ligado, criado: !!dados, modos: { ...ligados }, resumo: dados?.resumo ?? null,
      camadas: GRUPOS.flatMap((g) => camadas[g]).length + (portas ? 2 : 0) }),
    camadas,
  };
  caixa?.addEventListener("change", () => api.ligar(caixa.checked));
  sub?.querySelectorAll("input[data-mob]").forEach((i) => i.addEventListener("change", () => api.modo(i.dataset.mob, i.checked)));
  // (a vista "Transporte" da casca liga a secção através de api.ligar)
  await api.ligar(params.get("mobilidade") === "on");
  return api;
}
