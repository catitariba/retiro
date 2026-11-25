// Ativos no gêmeo: luminárias e sensores lidos das camadas (config.js) de poucos em poucos segundos.
// O gêmeo só LÊ. Se o servidor de ativos estiver desligado, o visor continua a funcionar e avisa em #ativosEstado.
// Efeito de luz: o SDK não tem luzes pontuais; cada poste aceso tem um globo e uma mancha no chão com material
// emissivo (brilham de noite). É um efeito visual, não ilumina os objetos à volta.
import { ATIVOS_URL, CAMADA, INTERVALO_MS } from "./config.js";
import { consultar } from "./ativos.js";
import { t, dado, fmt, poeTexto } from "./i18n.js";

const ALTURA_POSTE = 4.2;
const SEG = 12;
// cores do papel: calêndula (temperatura), branco (ruído), água (humidade do solo); contorno carvão
const COR_SENSOR = { temperatura: "#fcbd1c", ruido: "#ffffff", humidade_solo: "#7cc4ea" };

export async function iniciarAtivos({ view, map, SR, Graphic, GraphicsLayer, FeatureLayer, Mesh }) {
  const estadoEl = document.getElementById("ativosEstado");
  const dizer = (chave, vars, ok = true) => { if (estadoEl) { poeTexto(estadoEl, chave, vars); estadoEl.dataset.ok = ok ? "sim" : "nao"; } };
  // a interface (Gestión) recebe cada leitura por este evento; o gêmeo continua a ser o único a ler as camadas
  const avisar = (detail) => dispatchEvent(new CustomEvent("retiro:ativos", { detail }));
  if (!ATIVOS_URL) { dizer("atv.desligados", null, false); avisar({ ok: false, desligados: true, lums: [], sens: [] }); return null; }
  const [MeshMaterialMetallicRoughness, MeshComponent] = await Promise.all([
    $arcgis.import("@arcgis/core/geometry/support/MeshMaterialMetallicRoughness.js"),
    $arcgis.import("@arcgis/core/geometry/support/MeshComponent.js"),
  ]);

  // ---- postes: camada de elementos no cliente (popup e cor por estado)
  const postes = new FeatureLayer({
    title: "Luminárias",
    source: [],
    objectIdField: "OBJECTID",
    geometryType: "point",
    hasZ: true,
    spatialReference: SR,
    fields: [
      { name: "OBJECTID", type: "oid" }, { name: "id", type: "string" }, { name: "zona", type: "string" },
      { name: "regiao", type: "string" }, { name: "circuito", type: "string" }, { name: "estado", type: "string" }, { name: "intensidade", type: "integer" },
      { name: "potencia_w", type: "integer" }, { name: "potencia_origem", type: "string" },
      { name: "tipo_lampada", type: "string" }, { name: "origem", type: "string" },
    ],
    outFields: ["*"],
    elevationInfo: { mode: "absolute-height" },
    renderer: {
      type: "unique-value",
      field: "estado",
      defaultSymbol: poste("#23212c"),
      uniqueValueInfos: [{ value: "avariado", symbol: poste("#dd5000") }],   // brasa: só as avarias
    },
    popupTemplate: {
      outFields: ["*"],
      title: ({ graphic }) => t("pop.lum", { id: graphic.attributes.id }),
      content: ({ graphic: { attributes: a } }) => window.tabelaPopup([
        ["pop.estado", dado("estado", a.estado), a.estado === "avariado" ? "avaria" : ""], ["pop.intensidade", `${a.intensidade} %`], ["pop.potencia", `${a.potencia_w} W`],
        ["pop.pot_origem", dado("origem", a.potencia_origem)], ["pop.lampada", dado("texto", a.tipo_lampada)], ["pop.regiao", dado("texto", a.regiao)],
        ["pop.circuito", dado("texto", a.circuito)], ["pop.origem", dado("origem", a.origem)],
      ]),
    },
  });
  function poste(cor) {
    return { type: "point-3d", symbolLayers: [{ type: "object", resource: { primitive: "cylinder" }, anchor: "bottom",
      width: 0.16, depth: 0.16, height: ALTURA_POSTE, material: { color: cor }, castShadows: false }] };
  }

  // ---- sensores: ícone com a última leitura no rótulo e no popup
  const sensores = new FeatureLayer({
    title: "Sensores (simulados)",
    source: [],
    objectIdField: "OBJECTID",
    geometryType: "point",
    hasZ: true,
    spatialReference: SR,
    fields: [
      { name: "OBJECTID", type: "oid" }, { name: "id", type: "string" }, { name: "tipo", type: "string" },
      { name: "tipo_txt", type: "string" }, { name: "regiao", type: "string" }, { name: "leitura", type: "double" }, { name: "unidade", type: "string" },
      { name: "hora_txt", type: "string" }, { name: "origem", type: "string" },
    ],
    outFields: ["*"],
    elevationInfo: { mode: "absolute-height" },
    renderer: {
      type: "unique-value",
      field: "tipo",
      uniqueValueInfos: Object.entries(COR_SENSOR).map(([value, cor]) => ({
        value,
        symbol: {
          type: "point-3d",
          symbolLayers: [{ type: "icon", resource: { primitive: "square" }, material: { color: cor }, outline: { color: "#23212c", size: 1.5 }, size: 11 }],
          verticalOffset: { screenLength: 46, maxWorldLength: 40, minWorldLength: 3 },
          callout: { type: "line", size: 1, color: cor },
        },
      })),
    },
    labelingInfo: [{
      labelExpressionInfo: { expression: "Text($feature.leitura, '#,##0.0') + ' ' + $feature.unidade" },
      symbol: { type: "label-3d", symbolLayers: [{ type: "text", material: { color: "#23212c" }, halo: { color: [247, 240, 225, 0.92], size: 1.6 }, size: 10 }] },
      minScale: 4000,
    }],
    popupTemplate: {
      outFields: ["*"],
      title: ({ graphic: { attributes: a } }) => `${dado("sensor", a.tipo)} · ${a.id}`,
      content: ({ graphic: { attributes: a } }) => {
        const el = window.tabelaPopup([["pop.regiao", dado("texto", a.regiao)], ["pop.sens_leitura", `${fmt.num(a.leitura, 1)} ${a.unidade}`],
          ["pop.sens_hora", a.hora_txt ? fmt.relogio(Number(a.hora_txt)) : ""]]);
        const p = document.createElement("p");
        p.className = "tenue"; p.style.margin = "8px 0 0"; p.textContent = t("pop.sens_origem", { o: dado("origem", a.origem) });
        const d = document.createElement("div"); d.className = "pop"; d.append(el, p);
        return d;
      },
    },
  });

  // ---- globos e manchas de luz: três malhas únicas, refeitas quando o estado muda
  const luz = new GraphicsLayer({ title: "Luz das luminárias", elevationInfo: { mode: "absolute-height" } });
  const gradiente = (paragens, fundo) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, 128, 128); }
    const grad = g.createRadialGradient(64, 64, 1, 64, 64, 63);
    paragens.forEach(([t, cor]) => grad.addColorStop(t, cor));
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return c;
  };
  // cor: transparência a esbater; emissão: textura opaca que esbate para preto (a emissão ignora o alfa da cor,
  // por isso com a mesma textura o disco saía com borda dura)
  const texCor = gradiente([[0, "rgba(255,226,160,0.9)"], [0.45, "rgba(255,205,120,0.6)"], [0.8, "rgba(255,190,100,0.2)"], [1, "rgba(255,190,100,0)"]]);
  const texEmissao = gradiente([[0, "rgb(255,222,160)"], [0.45, "rgb(205,150,78)"], [0.8, "rgb(70,50,22)"], [1, "rgb(0,0,0)"]], "#000");
  const matMancha = (noite) => new MeshMaterialMetallicRoughness({
    color: [255, 214, 140, noite ? 1 : 0.3], colorTexture: { data: texCor }, alphaMode: "blend", doubleSided: true,
    emissiveColor: noite ? [255, 255, 255] : [50, 50, 50], emissiveTexture: { data: texEmissao }, roughness: 1, metallic: 0,
  });
  const matGloboAceso = new MeshMaterialMetallicRoughness({ color: [255, 236, 190], emissiveColor: [255, 214, 150], roughness: 0.4, metallic: 0 });
  const matGloboApagado = new MeshMaterialMetallicRoughness({ color: [70, 76, 72], roughness: 0.6, metallic: 0 });

  const chao = (x, y, z) => {            // cota do chão desenhado (para a mancha não se enterrar em terreno inclinado)
    try {
      const s = view.groundView?.elevationSampler;
      const v = s?.elevationAt ? s.elevationAt(x, y) : null;
      if (Number.isFinite(v) && Math.abs(v - z) < 3) return v;
    } catch { /* fica a cota da camada */ }
    return z;
  };
  function malhaManchas(lista, noite) {
    const N = 1 + 2 * SEG, pos = new Float64Array(lista.length * N * 3), uv = new Float32Array(lista.length * N * 2);
    const faces = new Uint32Array(lista.length * SEG * 3 * 3);
    let f = 0;
    lista.forEach((p, i) => {
      const R = 5 + 9 * p.intensidade / 100, b = i * N;
      const por = (k, x, y, u, v) => { pos.set([x, y, chao(x, y, p.z) + 0.22], (b + k) * 3); uv.set([u, v], (b + k) * 2); };
      por(0, p.x, p.y, 0.5, 0.5);
      for (let s = 0; s < SEG; s++) {
        const a = (s / SEG) * 2 * Math.PI, c = Math.cos(a), d = Math.sin(a);
        por(1 + s, p.x + c * R * 0.5, p.y + d * R * 0.5, 0.5 + c * 0.25, 0.5 + d * 0.25);
        por(1 + SEG + s, p.x + c * R, p.y + d * R, 0.5 + c * 0.5, 0.5 + d * 0.5);
      }
      for (let s = 0; s < SEG; s++) {
        const i0 = b + 1 + s, i1 = b + 1 + (s + 1) % SEG, o0 = i0 + SEG, o1 = i1 + SEG;
        faces.set([b, i0, i1, i0, o0, o1, i0, o1, i1], f);
        f += 9;
      }
    });
    return new Mesh({ spatialReference: SR, vertexAttributes: { position: pos, uv }, components: [new MeshComponent({ faces, material: matMancha(noite) })] });
  }
  function malhaGlobos(lista, material) {
    const pos = new Float64Array(lista.length * 6 * 3), faces = new Uint32Array(lista.length * 8 * 3);
    const T = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
    lista.forEach((p, i) => {
      const r = 0.34, z = p.z + ALTURA_POSTE + 0.2, b = i * 6;
      pos.set([p.x + r, p.y, z, p.x - r, p.y, z, p.x, p.y + r, z, p.x, p.y - r, z, p.x, p.y, z + r * 1.2, p.x, p.y, z - r * 1.2], b * 3);
      T.forEach((t, k) => faces.set(t.map((v) => v + b), (i * 8 + k) * 3));
    });
    return new Mesh({ spatialReference: SR, vertexAttributes: { position: pos }, components: [new MeshComponent({ faces, material, shading: "flat" })] });
  }
  const simb = { type: "mesh-3d", symbolLayers: [{ type: "fill", castShadows: false }] };

  map.addMany([luz, postes, sensores]);

  // ---- estado e releitura
  let lums = [], noite = false, ligado = false, falhas = 0;
  function redesenharLuz() {
    luz.removeAll();
    const acesos = lums.filter((p) => p.estado === "ligado" && p.intensidade > 0);
    const outros = lums.filter((p) => !(p.estado === "ligado" && p.intensidade > 0));
    if (acesos.length) {
      luz.add(new Graphic({ geometry: malhaManchas(acesos, noite), symbol: simb }));
      luz.add(new Graphic({ geometry: malhaGlobos(acesos, matGloboAceso), symbol: simb }));
    }
    if (outros.length) luz.add(new Graphic({ geometry: malhaGlobos(outros, matGloboApagado), symbol: simb }));
  }
  const ponto = (p) => ({ type: "point", x: p.x, y: p.y, z: p.z, spatialReference: SR });
  // Só vão para a camada os elementos novos ou alterados (com o parque inteiro são mais de mil postes).
  const conhecidos = new Map();           // camada -> Map(OBJECTID -> assinatura)
  async function sincronizar(camada, novos, atributos, assinar) {
    const ant = conhecidos.get(camada) ?? new Map(), agora = new Map(), add = [], upd = [];
    for (const p of novos) {
      const a = assinar(p);
      agora.set(p.OBJECTID, a);
      if (!ant.has(p.OBJECTID)) add.push(new Graphic({ geometry: ponto(p), attributes: atributos(p) }));
      else if (ant.get(p.OBJECTID) !== a) upd.push(new Graphic({ geometry: ponto(p), attributes: atributos(p) }));
    }
    const del = [...ant.keys()].filter((i) => !agora.has(i)).map((objectId) => ({ objectId }));
    if (add.length || upd.length || del.length) await camada.applyEdits({ addFeatures: add, updateFeatures: upd, deleteFeatures: del });
    conhecidos.set(camada, agora);
    return add.length + upd.length + del.length;
  }
  async function reler() {
    try {
      const [l, s] = await Promise.all([consultar(CAMADA.luminarias), consultar(CAMADA.sensores)]);
      const mudou = await sincronizar(postes, l, ({ x: _x, y: _y, z: _z, ...attrs }) => attrs, (p) => `${p.estado}:${p.intensidade}`);
      if (mudou) { lums = l; redesenharLuz(); }
      // hora_txt guarda a hora da leitura em ms (texto): o popup formata-a no idioma de quem o abre
      await sincronizar(sensores, s, (p) => ({ OBJECTID: p.OBJECTID, id: p.id, tipo: p.tipo, tipo_txt: p.tipo,
        regiao: p.regiao, leitura: p.leitura, unidade: p.unidade, origem: p.origem,
        hora_txt: String(p.hora_leitura) }), (p) => String(p.hora_leitura));
      const acesos = l.filter((p) => p.estado === "ligado").length;
      dizer("atv.estado", { n: l.length, a: acesos, s: s.length });
      ligado = true;
      falhas = 0;
      avisar({ ok: true, lums: l, sens: s });
    } catch (e) {
      falhas++;
      dizer(ligado ? "atv.sem_ligacao" : "atv.servidor_off", null, false);
      avisar({ ok: false, lums: ligado ? lums : [], sens: [] });
      if (falhas === 1) console.warn("ativos: sem ligação a", ATIVOS_URL, e?.message);
    }
  }
  await reler();
  // releitura: de INTERVALO_MS em INTERVALO_MS; de segundo a segundo enquanto o painel está aberto ao lado do mapa
  let aLer = false, rapido = false, ultima = performance.now();
  setInterval(async () => {
    if (aLer || document.hidden || performance.now() - ultima < (rapido ? 900 : INTERVALO_MS - 100)) return;
    aLer = true;
    ultima = performance.now();
    await reler();
    aLer = false;
  }, 500);

  const api = {
    camadas: { postes, sensores, luz },
    reler,
    rapido(v) { rapido = !!v; },
    definirHora(h) {                       // de noite a mancha brilha; de dia fica ténue
      const n = h < 6.75 || h >= 20.75;
      if (n !== noite) { noite = n; redesenharLuz(); }
    },
    visivel(v) { luz.visible = postes.visible = sensores.visible = v; },
    visivelLuz(v) { luz.visible = postes.visible = v; },
    visivelSensores(v) { sensores.visible = v; },
    info: () => ({ ligado, luminarias: lums.length, acesas: lums.filter((p) => p.estado === "ligado").length, noite }),
  };
  // quando a câmara pára, o chão pode ter outro nível de detalhe: reassentar as manchas
  const reactiveUtils = await $arcgis.import("@arcgis/core/core/reactiveUtils.js");
  // Só depois de 1,5 s parada e se a câmara mudou bastante: refazer mais de mil manchas a cada paragem custava
  // caro (medido: 38 -> 11 fps na vista Parque quando isto corria a cada paragem).
  let espera = null, ultimaCam = null;
  reactiveUtils.watch(() => view.stationary, (parada) => {
    clearTimeout(espera);
    if (!parada || !lums.length) return;
    espera = setTimeout(() => {
      const c = view.camera.position;
      if (!view.stationary) return;
      if (ultimaCam && Math.hypot(c.x - ultimaCam.x, c.y - ultimaCam.y, c.z - ultimaCam.z) < 60) return;
      ultimaCam = { x: c.x, y: c.y, z: c.z };
      redesenharLuz();
    }, 1500);
  });
  return api;
}
