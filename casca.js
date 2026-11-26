// Casca "papel": entrada (Visita / Gestión), quadro de cada app, destinos sobre o mapa, chamada, hora do dia.
// Desenha-se logo. A entrada mostra o plano 2D (web/plano2d.js) e NÃO carrega o SDK: o SDK e a cena 3D (main.js) só se
// carregam quando a pessoa entra numa app em 3D (garantir3D). Na Visita pode escolher-se Plano (2D, leve) ou 3D; no celular
// a Visita abre no plano. O gêmeo (main.js) liga-se com casca.registar("gemeo", {...}) e os módulos
// opcionais com casca.registar("ativos"|"mobilidade"|"passeio", api). A casca nunca fala com as camadas de ativos:
// lê o que o gêmeo já leu (evento "retiro:ativos"); quem escreve nelas é o painel (separador Control).
import { t, dado, fmt, aplicar, poeTexto, seletorIdioma, lang } from "./i18n.js";
import { carregarPlano, montarPlano } from "./plano2d.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const params = new URLSearchParams(location.search);
const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- vistas de câmara (as mesmas de main.js) e o que a Visita mostra delas
const VISTAS = ["parque", "estanque", "monumento", "passeio", "cristal", "velazquez", "rosaleda", "parterre", "estatuas", "vacas", "cecilio",
  "independencia", "angel", "mobilidade"];
const ZONAS = [
  ["parque", null], ["estanque", "Estanque", "zona.estanque_s"], ["monumento", "Monumento a Alfonso XII"], ["passeio", null, "zona.passeio_s"],
  ["cristal", "Palacio de Cristal"], ["velazquez", "Palacio de Velázquez"], ["rosaleda", "Rosaleda", "zona.rosaleda_s"], ["parterre", "Parterre"],
  ["estatuas", "Paseo de las Estatuas"], ["vacas", "Casa de Vacas", "zona.vacas_s"], ["cecilio", "Jardines de Cecilio Rodríguez"],
  ["independencia", "Puerta de la Independencia"], ["angel", "Ángel Caído"], ["mobilidade", null, "zona.mobilidade_s"],
];
const VINHETA = { estanque: "pato", cecilio: "pavao", parterre: "ahuehuete", cristal: "castanheiro", velazquez: "platano", rosaleda: "periquito",
  estatuas: "platano", vacas: "castanheiro", angel: "periquito", monumento: "pato", passeio: "pato" };
const NATUREZA = [["ahuehuete", "Taxodium mucronatum", "parterre"], ["pato", "Anas platyrhynchos", "estanque"], ["pavao", "Pavo cristatus", "cecilio"],
  ["periquito", "Myiopsitta monachus", "parque"], ["platano", "Platanus × hispanica", "parque"], ["castanheiro", "Aesculus hippocastanum", "parque"]];
const vinheta = (id) => (id ? `<img class="vin" src="ui/natureza/${id}.webp" alt="" loading="lazy">` : "");
// região das camadas de ativos -> vista (as "Resto do parque · …" vão ao centro dos seus postes)
const VISTA_DA_REGIAO = { "Estanque": "estanque", "Palacio de Cristal": "cristal", "Palacio de Velázquez": "velazquez", "Rosaleda": "rosaleda",
  "Parterre": "parterre", "Paseo de las Estatuas": "estatuas", "Casa de Vacas": "vacas", "Cecilio Rodríguez": "cecilio" };
const MODOS_MOB = [["autocarro", "#2f7fd6"], ["metro", "#e0292f"], ["cercanias", "#c2185b"], ["bicimad", "#19b5a5"], ["outros", "#f2f2f2"]];
const ZONAS_MODELADAS = 8;
// vista de câmara -> o que mostrar no plano 2D (zona do plano, ou ponto em coordenadas locais = real − (442000, 4474000))
const VISTA_NO_PLANO = { estanque: "piloto", monumento: "piloto", passeio: "piloto", cristal: "cristal", velazquez: "velazquez",
  rosaleda: "rosaleda", parterre: "parterre", estatuas: "estatuas", vacas: "vacas", cecilio: "cecilio", angel: [64, -410], independencia: [-389, 579] };
const ZONA_PARA_VISTA = { piloto: "estanque", cristal: "cristal", velazquez: "velazquez", rosaleda: "rosaleda", parterre: "parterre",
  estatuas: "estatuas", vacas: "vacas", cecilio: "cecilio" };
const CELULAR = matchMedia("(max-width: 700px)");
// limiares de aviso desta interface (não do serviço)
const LIM = { ruido: 70, solo: 18 };

// ---- estado
const mod = { gemeo: null, ativos: null, mobilidade: null, passeio: null };
const st = {
  app: ["visita", "gestion"].includes(params.get("app")) ? params.get("app") : params.has("painel") ? "gestion" : "inicio",
  q: { visita: "chegar", gestion: params.has("painel") ? "control" : "operacao" },
  vista: "estanque", hora: 16, regiao: null,
  camadas: { ilum: true, sens: true, arv: true, sombras: true, arte: true, mob: params.get("mobilidade") === "on" },
  mobModos: Object.fromEntries(MODOS_MOB.map(([m]) => [m, true])),
  ativos: null,               // { ok, lums, sens } da última leitura do gêmeo
  portas: null,               // features de data/mobilidade/portas.geojson
  // motor do mapa nas apps: "2d" (plano SVG) ou "3d" (SDK). A Gestión é sempre 3D (o placar vem do gêmeo).
  // sem ?motor=, decide-se ao entrar na app (largura do ecrã nesse momento): celular -> plano, resto -> 3D
  motor: ["2d", "3d"].includes(params.get("motor")) ? params.get("motor") : null,
  resumo: null,               // contagens de data/parque.json (a entrada não carrega as camadas)
};
if (params.get("q") && st.app !== "inicio") st.q[st.app] = params.get("q");

// ---- contas das regiões (a partir das leituras)
function regioes() {
  const A = st.ativos;
  if (!A?.lums?.length) return [];
  const m = new Map();
  for (const p of A.lums) {
    const r = m.get(p.regiao) ?? { regiao: p.regiao, n: 0, ligadas: 0, avariadas: 0, w: 0, sens: {}, lums: [] };
    r.n++; r.lums.push(p);
    if (p.estado === "ligado") { r.ligadas++; r.w += p.potencia_w * p.intensidade / 100; }
    if (p.estado === "avariado") r.avariadas++;
    m.set(p.regiao, r);
  }
  for (const s of A.sens ?? []) {
    const r = m.get(s.regiao);
    if (!r) continue;
    (r.sens[s.tipo] ??= []).push(s.leitura);
  }
  const media = (v) => (v?.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
  const ORD = { avaria: 0, aviso: 1, ok: 2 };
  return [...m.values()].map((r) => {
    r.temperatura = media(r.sens.temperatura); r.ruido = media(r.sens.ruido); r.solo = media(r.sens.humidade_solo);
    r.nivel = r.avariadas ? "avaria" : (r.ruido > LIM.ruido || r.solo < LIM.solo) ? "aviso" : "ok";
    r.txt = r.avariadas ? t(r.avariadas > 1 ? "ges.e_avarias" : "ges.e_avaria", { n: r.avariadas })
      : r.ruido > LIM.ruido ? t("ges.e_ruido") : r.solo < LIM.solo ? t("ges.e_seco") : t("ges.e_ok");
    return r;
  }).sort((a, b) => ORD[a.nivel] - ORD[b.nivel] || b.n - a.n);
}
function totais(rs) {
  return rs.reduce((a, r) => ({ n: a.n + r.n, ligadas: a.ligadas + r.ligadas, avariadas: a.avariadas + r.avariadas, w: a.w + r.w,
    avisos: a.avisos + (r.nivel === "aviso" ? 1 : 0) }), { n: 0, ligadas: 0, avariadas: 0, w: 0, avisos: 0 });
}
const nv = (v, casas = 1) => (v == null ? "—" : fmt.num(v, casas));
const minPe = (m) => Math.max(1, Math.round(m / 1.3 / 60));
const portaCurta = (n) => n.replace(/^Puerta (de la |del |de )/, "");

// ---------------------------------------------------------------- relógio, hora
function definirHora(h, origem) {
  st.hora = h;
  document.querySelectorAll("[data-relogio]").forEach((el) => { el.textContent = fmt.hora(h); el.setAttribute("aria-label", t("hora.aria", { h: fmt.hora(h) })); });
  if (origem !== "cursor") $("#hora").value = String(h);
  mod.gemeo?.definirHora(h);
}
function horaDeMadrid() {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const h = Number(p.find((x) => x.type === "hour").value) + Number(p.find((x) => x.type === "minute").value) / 60;
  return Math.min(24, Math.max(5, Math.round(h * 4) / 4));
}
$("#hora").addEventListener("input", (e) => definirHora(Number(e.target.value), "cursor"));
$("#agora").addEventListener("click", () => definirHora(horaDeMadrid()));

// ---------------------------------------------------------------- app e separadores
const SEPARADORES = { visita: ["chegar", "passeios", "zonas", "natureza"], gestion: ["operacao", "control", "camadas"] };
const ROT_SEP = { chegar: "vis.chegar", passeios: "vis.passeios", zonas: "vis.zonas", natureza: "vis.natureza", operacao: "ges.operacao",
  control: "ges.control", camadas: "ges.camadas" };

function poeUrl() {
  const u = new URL(location.href);
  u.searchParams.delete("painel");
  if (st.camadas.mob) u.searchParams.set("mobilidade", "on"); else u.searchParams.delete("mobilidade");
  if (st.app === "inicio") { u.searchParams.delete("app"); u.searchParams.delete("q"); }
  else { u.searchParams.set("app", st.app); u.searchParams.set("q", st.q[st.app]); }
  if (st.app === "visita" && st.motor) u.searchParams.set("motor", st.motor); else u.searchParams.delete("motor");
  history.replaceState(null, "", u);
}
function irApp(app) {
  if (app === "inicio") sairAmpliado();
  if (app !== "inicio" && document.body.classList.contains("passeio-ativo")) mod.passeio?.sair();
  st.app = app;
  document.body.dataset.app = app;
  fechaChamada();
  if (app !== "inicio") { desenhaApp(); aplicaMotor(); }
  else desenhaEntrada();
  rapidoAtivos();
  poeUrl();
}
function desenhaApp() {
  const a = st.app;
  poeTexto($("#marcaNome"), a === "visita" ? "app.visita" : "app.gestion");
  poeTexto($("#horaRot"), a === "visita" ? "hora.ver" : "hora.rot");
  const modos = $("#modos");
  modos.dataset.i18nAttr = `aria-label:${a === "visita" ? "vis.tabs" : "ges.tabs"}`;
  aplicar(modos.parentElement);
  modos.innerHTML = SEPARADORES[a].map((q) => `<button role="tab" data-q="${q}" aria-selected="${q === st.q[a]}">${esc(t(ROT_SEP[q]))}${q === "operacao" ? `<span class="n" id="nAt"></span>` : ""}</button>`).join("");
  modos.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => mostra(b.dataset.q)));
  desenhaPlacar();
  mostra(st.q[a]);
  document.title = `${t("doc.titulo")} · ${t(a === "visita" ? "app.visita" : "app.gestion")}`;
}
function mostra(q) {
  const a = st.app;
  if (!SEPARADORES[a].includes(q)) q = SEPARADORES[a][0];
  st.q[a] = q;
  $("#modos").querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.q === q)));
  const control = q === "control";
  $("#corpo").hidden = control;
  $("#controlo").hidden = !control;
  if (control) abreControlo();
  else { $("#corpo").innerHTML = QUADROS[q](); ligaCorpo(); $("#corpo").scrollTop = 0; }
  marcaAtencao();
  rapidoAtivos();
  poeUrl();
}
function redesenhaCorpo() {          // mantém o scroll (releituras de 4 em 4 s)
  if (st.app === "inicio" || st.q[st.app] === "control") return;
  const c = $("#corpo"), y = c.scrollTop, foco = document.activeElement?.dataset;
  c.innerHTML = QUADROS[st.q[st.app]](true);
  ligaCorpo(true);
  c.scrollTop = y;
  if (foco?.regiao) c.querySelector(`tr[data-regiao="${CSS.escape(foco.regiao)}"]`)?.focus();
}
function ligaCorpo(semAnim) {
  const c = $("#corpo");
  c.querySelectorAll("tr.linha").forEach((tr, i) => {
    if (!reduz && !semAnim) tr.querySelectorAll("td").forEach((td) => (td.style.animationDelay = Math.min(i, 14) * 35 + "ms"));
    else tr.classList.remove("entra");
    tr.addEventListener("click", (e) => { if (!e.target.closest("button")) escolhe(tr); });
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === tr) escolhe(tr); });
  });
  c.querySelectorAll(".interruptor").forEach((b) => b.addEventListener("click", () => alternaCamada(b.dataset.c)));
  c.querySelectorAll(".chips button").forEach((b) => b.addEventListener("click", () => alternaModo(b.dataset.m)));
  c.querySelectorAll("[data-abrir3d]").forEach((b) => b.addEventListener("click", () => poeMotor("3d")));
}

// ---------------------------------------------------------------- quadros da Visita
const secTit = (a, b) => `<div class="sec-tit"><span class="rot">${a}</span><span class="rot">${b ?? ""}</span></div>`;
const interruptor = (id, on, rot, desligado) => `<button class="interruptor" role="switch" aria-checked="${on}" aria-label="${esc(rot)}" data-c="${id}"${desligado ? " disabled" : ""}></button>`;
const chipsMob = () => `<div class="chips" role="group" aria-label="${esc(t("mob.grupo"))}">${MODOS_MOB.map(([m, cor]) =>
  `<button type="button" data-m="${m}" aria-pressed="${st.mobModos[m]}"${m === "outros" ? ` title="${esc(t("mob.outros_t"))}"` : ""}><i style="background:${cor}"></i>${esc(t("mob." + m))}</button>`).join("")}</div>`;

function quadroChegar(semAnim) {
  const P = st.portas;
  const ent = semAnim ? "" : " entra";
  const mob = `<table class="q"><tbody><tr class="ok sem-num"><td class="nome longo">${esc(t("vis.transporte"))}<span class="sub">${esc(t("vis.transporte_s"))}</span></td>
    <td>${interruptor("mob", st.camadas.mob, t("vis.transporte"), mod.gemeo && !mod.mobilidade)}</td></tr></tbody></table>${st.camadas.mob ? chipsMob() : ""}`;
  if (!P) return mob + secTit(esc(t("vis.ch_tit"))) + `<p class="rod">${esc(t("vis.ch_cargando"))}</p>`;
  const linhas = P.map((f, i) => {
    const a = f.properties, [e] = (a.metro || "").split(" · "), est = e.replace(/\s*\(.*\)/, ""), lin = ((e.match(/\((.*)\)/) || [, ""])[1]).split(",")[0];
    const bp = (a.autocarro_perto || "").replace(/ · .*/, ""), stop = bp.replace(/\s*\(.*$/, ""), bl = ((bp.match(/\((.*)\)/) || [, ""])[1]).split(", ");
    return `<tr class="linha ok${ent}" tabindex="0" data-porta="${i}" aria-selected="false"><td class="nome">${esc(portaCurta(dado("texto", a.nome)))}</td>
      <td class="s" style="text-align:left;font-size:15px;color:inherit">${lin ? `<span class="metro">${esc(lin)}</span>` : ""}${esc(est)}</td>
      <td class="n">${esc(t("vis.min", { n: minPe(a.metro_m) }))}</td>
      <td class="mx bus">${esc(stop)}<span class="sub">${esc(bl.slice(0, 4).join(" · "))}${bl.length > 4 ? " …" : ""}</span></td></tr>`;
  }).join("");
  return mob + secTit(esc(t("vis.ch_tit")), esc(t("vis.ch_tit2"))) +
    `<table class="q"><thead><tr><th>${esc(t("vis.th_porta"))}</th><th style="text-align:left">${esc(t("vis.th_metro"))}</th><th>${esc(t("vis.th_pe"))}</th><th class="mx" style="text-align:left">${esc(t("vis.th_bus"))}</th></tr></thead>
    <tbody>${linhas}</tbody></table><p class="rod">${esc(t("vis.ch_rod"))}</p>`;
}
function quadroPasseios(semAnim) {
  const P = mod.passeio?.percursos;
  if (!P && st.motor === "2d") return secTit(esc(t("vis.pa_tit"))) + `<p class="rod">${esc(t("vis.pa_3d"))}</p>` +
    `<p class="rod" style="padding-top:0"><button type="button" class="btn forte" data-abrir3d>${esc(t("vis.pa_abrir3d"))}</button></p>`;
  if (!P) return secTit(esc(t("vis.pa_tit"))) + `<p class="rod">${esc(t(st.passeioFalhou ? "vis.pa_falta" : "vis.pa_cargando"))}</p>`;
  const ent = semAnim ? "" : " entra";
  return secTit(esc(t("vis.pa_tit")), esc(t("vis.pa_tit2"))) +
    `<table class="q"><thead><tr><th>${esc(t("vis.th_percurso"))}</th><th>${esc(t("vis.th_km"))}</th><th>${esc(t("vis.th_min"))}</th><th></th></tr></thead><tbody>
    ${P.map((p) => `<tr class="linha ok${ent}" tabindex="0" data-passeio="${esc(p.id)}"><td class="nome longo">${esc(dado("percurso", p))}</td>
      <td class="n">${fmt.num(p.L / 1000, 1)}</td><td class="n">${minPe(p.L)}</td><td class="ir">${esc(t("vis.partir"))}</td></tr>`).join("")}
    <tr class="linha ok${ent}" tabindex="0" data-passeio="livre"><td class="nome longo">${esc(t("vis.livre"))}<span class="sub">${esc(t("vis.livre_s"))}</span></td><td></td><td></td><td class="ir">${esc(t("vis.partir"))}</td></tr>
    </tbody></table><p class="rod">${esc(t("vis.pa_rod"))}</p>`;
}
function quadroZonas(semAnim) {
  const Z = ZONAS.filter(([id]) => id !== "mobilidade" || mod.mobilidade);
  const ent = semAnim ? "" : " entra";
  return secTit(esc(t("vis.zo_tit")), esc(t("vis.zo_tit2", { n: Z.length }))) + `<table class="q"><tbody>
    ${Z.map(([id, nome, sub]) => `<tr class="linha ok${ent} tem-vin" tabindex="0" data-z="${id}" aria-selected="${id === st.vista}"><td class="nome longo">${vinheta(VINHETA[id])}${esc(nome ?? t("vista." + id))}${sub ? `<span class="sub">${esc(t(sub))}</span>` : ""}</td><td class="ir">${esc(t("vis.ver"))}</td></tr>`).join("")}
    </tbody></table><p class="rod">${esc(t("vis.zo_rod"))}</p>`;
}
function quadroNatureza(semAnim) {
  const ent = semAnim ? "" : " entra";
  return secTit(esc(t("vis.na_tit")), esc(t("vis.na_tit2"))) + `<table class="q"><tbody>
    ${NATUREZA.map(([id, lat, z]) => `<tr class="linha ok${ent} tem-vin" tabindex="0" data-z="${z}"><td class="nome longo">${vinheta(id)}${esc(t("nat." + id))}<span class="sub"><span class="lat">${esc(lat)}</span> · ${esc(t(`nat.${id}_o`))}. ${esc(t(`nat.${id}_n`))}.</span></td><td class="ir">${esc(t("vis.ver"))}</td></tr>`).join("")}
    </tbody></table><p class="rod">${esc(t("vis.na_rod"))}</p>`;
}

// ---------------------------------------------------------------- quadros da Gestión
function desenhaPlacar() {
  const el = $("#placar");
  if (st.app !== "gestion") { el.innerHTML = ""; return; }
  const rs = regioes(), T = totais(rs), ok = rs.length > 0;
  el.innerHTML = `
    <div class="p"><span class="rot">${esc(t("ges.p_luzes"))}</span><span class="v">${ok ? `${fmt.num(T.ligadas)}<small>/${fmt.num(T.n)}</small>` : "—"}</span></div>
    <div class="p"><span class="rot">${esc(t("ges.p_pot"))}</span><span class="v">${ok ? `${fmt.kW(T.w)}<small>kW</small>` : "—"}</span></div>
    <div class="p avaria"><span class="rot">${esc(t("ges.p_avarias"))}</span><span class="v">${ok ? fmt.num(T.avariadas) : "—"}</span></div>
    <div class="p aviso"><span class="rot">${esc(t("ges.p_avisos"))}</span><span class="v">${ok ? fmt.num(T.avisos) : "—"}</span></div>`;
}
function marcaAtencao() {
  const n = $("#nAt");
  if (n) n.textContent = st.app === "gestion" ? (regioes().filter((r) => r.nivel !== "ok").length || "") : "";
}
function quadroOperacao(semAnim) {
  const rs = regioes();
  if (!rs.length) {
    const k = !mod.gemeo ? "ges.op_espera" : st.ativos?.desligados ? "ges.op_off" : st.ativos && !st.ativos.ok ? "ges.op_sem" : "ges.op_espera";
    return secTit(esc(t("ges.op_tit"))) + `<p class="rod">${esc(t(k))}</p>`;
  }
  const wMax = Math.max(...rs.map((r) => r.w), 1), ent = semAnim ? "" : " entra";
  return secTit(esc(t("ges.op_tit")), esc(t("ges.op_tit2", { n: rs.length }))) +
    `<table class="q"><thead><tr><th>${esc(t("ges.th_regiao"))}</th><th>${esc(t("ges.th_luzes"))}</th><th class="mx mx2">kW</th><th class="mx mx2">°C</th><th class="mx">dB</th><th class="mx">${esc(t("ges.th_solo"))}</th><th>${esc(t("ges.th_estado"))}</th></tr></thead><tbody>
    ${rs.map((r) => `<tr class="linha ${r.nivel}${ent}" tabindex="0" data-regiao="${esc(r.regiao)}" aria-selected="${r.regiao === st.regiao}">
      <td class="nome">${esc(dado("texto", r.regiao))}</td><td class="n ${r.avariadas ? "x" : ""}">${r.ligadas}/${r.n}</td>
      <td class="n mx mx2" title="${Math.round((r.w / wMax) * 100)} %">${fmt.kW(r.w)}</td><td class="n mx mx2">${nv(r.temperatura)}</td>
      <td class="n mx ${r.ruido > LIM.ruido ? "a" : ""}">${nv(r.ruido, 0)}</td><td class="n mx ${r.solo < LIM.solo ? "a" : ""}">${r.solo == null ? "—" : nv(r.solo, 0) + " %"}</td>
      <td class="est"><span>${esc(r.txt)}</span></td></tr>`).join("")}
    </tbody></table><p class="rod">${esc(t("ges.op_rod"))}</p>`;
}
function quadroCamadas(semAnim) {
  const A = st.ativos, g = mod.gemeo, ent = semAnim ? "" : " entra";
  const linha = (id, nome, sub, desligado) => `<tr class="ok${ent}"><td class="nome longo">${esc(t(nome))}<span class="sub">${esc(sub)}</span></td>
    <td>${interruptor(id, st.camadas[id], t(nome), desligado)}</td></tr>`;
  return secTit(esc(t("ges.ca_tit")), esc(t("ges.ca_tit2"))) + `<table class="q"><thead><tr><th>${esc(t("ges.th_camada"))}</th><th></th></tr></thead><tbody>
    ${linha("ilum", "ges.c_ilum", t("ges.c_ilum_s", { n: A?.lums?.length ?? 0 }), !mod.ativos)}
    ${linha("sens", "ges.c_sens", t("ges.c_sens_s", { n: A?.sens?.length ?? 0 }), !mod.ativos)}
    ${linha("arv", "ges.c_arv", t("ges.c_arv_s", { n: g?.contagens.arvores ?? 0 }), !g)}
    ${linha("sombras", "ges.c_sombras", t("ges.c_sombras_s"), !g)}
    ${linha("arte", "ges.c_arte", t("ges.c_arte_s", { n: g?.contagens.arte ?? 0 }), !g)}
    ${linha("mob", "ges.c_mob", t("ges.c_mob_s"), !mod.mobilidade)}
    </tbody></table>${st.camadas.mob ? chipsMob() : ""}
    ${`<div class="sec-tit solto"><span class="rot">${esc(t("ges.li_tit"))}</span><span class="rot">${esc(t("ges.li_tit2"))}</span></div>`}
    <table class="q"><tbody>
      <tr class="ok"><td class="nome">${esc(t("ges.li_ruido"))}</td><td class="n">&gt; ${LIM.ruido} dB</td></tr>
      <tr class="ok"><td class="nome">${esc(t("ges.li_solo"))}</td><td class="n">&lt; ${LIM.solo} %</td></tr>
      <tr class="ok"><td class="nome">${esc(t("ges.li_apagada"))}</td><td class="n">${esc(t("ges.li_avaria"))}</td></tr>
    </tbody></table><p class="rod">${esc(t("rod.dados"))}</p>`;
}
const QUADROS = { chegar: quadroChegar, passeios: quadroPasseios, zonas: quadroZonas, natureza: quadroNatureza, operacao: quadroOperacao, camadas: quadroCamadas };

// ---------------------------------------------------------------- ações
function escolhe(tr) {
  const d = tr.dataset;
  if (d.passeio) {
    if (st.motor === "2d") poeMotor("3d");   // o passeio acontece no modelo 3D
    const p = mod.passeio;
    if (!p) { poeMotor("3d"); quando("passeio").then((pp) => { if (pp) { pp.escolher(d.passeio); pp.entrar(); } }); return; }
    fechaChamada();
    p.escolher(d.passeio);
    p.entrar();
    return;
  }
  document.querySelectorAll("#corpo tr.linha").forEach((x) => x.setAttribute("aria-selected", String(x === tr)));
  if (d.z) irVista(d.z);
  else if (d.porta != null) {
    const f = st.portas[Number(d.porta)];
    if (st.motor === "2d") plano?.irPonto(f.geometry.coordinates[0] - 442000, f.geometry.coordinates[1] - 4474000, 320);
    else mod.gemeo?.irPonto(f.geometry.coordinates[0], f.geometry.coordinates[1]);
    marcaDestino(null);
  } else if (d.regiao) abreChamada(d.regiao);
}
function irVista(nome) {
  if (st.motor === "2d" && st.app !== "gestion") {
    if (nome === "mobilidade") { st.vista = nome; poeMotor("3d"); if (!st.camadas.mob) alternaCamada("mob"); return; }
    st.vista = nome;
    marcaDestino(nome);
    const alvo = VISTA_NO_PLANO[nome];
    if (!alvo) plano?.inteiro(); else if (Array.isArray(alvo)) plano?.irPonto(alvo[0], alvo[1], 320); else plano?.irZona(alvo);
    return;
  }
  st.vista = nome;                       // se o 3D ainda está a carregar, a câmara vai para aqui quando o gêmeo se registar
  marcaDestino(nome);
  if (!mod.gemeo) return;
  mod.gemeo.irVista(nome);
  if (nome === "mobilidade" && mod.mobilidade && !st.camadas.mob) alternaCamada("mob");
}
function alternaCamada(id) {
  const v = !st.camadas[id];
  st.camadas[id] = v;
  const g = mod.gemeo;
  if (id === "ilum") mod.ativos?.visivelLuz(v);
  else if (id === "sens") mod.ativos?.visivelSensores(v);
  else if (id === "arv" && g) g.camadas.arvores.visible = v;
  else if (id === "arte" && g) g.camadas.arte.visible = v;
  else if (id === "sombras") g?.sombras(v);
  else if (id === "mob") { mod.mobilidade?.ligar(v); poeUrl(); if (v && st.motor === "2d") poeMotor("3d"); }
  redesenhaCorpo();
}
function alternaModo(m) {
  st.mobModos[m] = !st.mobModos[m];
  mod.mobilidade?.modo(m, st.mobModos[m]);
  redesenhaCorpo();
}

// ---------------------------------------------------------------- destinos (pílulas sobre o mapa)
function desenhaDestinos() {
  const el = $("#destinos");
  el.innerHTML = VISTAS.filter((v) => v !== "mobilidade" || mod.mobilidade || !mod.gemeo).map((v) => `<button type="button" data-vista="${v}" aria-pressed="${v === st.vista}">${esc(t("vista." + v))}</button>`).join("");
  el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => irVista(b.dataset.vista)));
}
function marcaDestino(id) {
  if (id) st.vista = id;
  document.querySelectorAll("#destinos button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vista === id)));
}

// ---------------------------------------------------------------- chamada (Gestión)
function abreChamada(nome) {
  const r = regioes().find((x) => x.regiao === nome);
  if (!r) return;
  st.regiao = nome;
  document.querySelectorAll("#corpo tr.linha").forEach((x) => x.setAttribute("aria-selected", String(x.dataset.regiao === nome)));
  const av = r.lums.find((p) => p.estado === "avariado");
  const c = $("#chamada");
  c.className = "chamada " + r.nivel;
  c.innerHTML = `<button class="fecha" type="button" aria-label="${esc(t("ges.ch_fechar"))}">×</button><span class="rot">${esc(t("ges.ch_regiao"))}</span><h2>${esc(dado("texto", nome))}</h2><div class="est">${esc(r.txt)}</div>
    <dl><dt>${esc(t("ges.th_luzes"))}</dt><dt>kW</dt><dt>°C</dt><dt>dB</dt><dt>${esc(t("ges.th_solo"))}</dt>
      <dd>${r.ligadas}/${r.n}</dd><dd>${fmt.kW(r.w)}</dd><dd>${nv(r.temperatura)}</dd><dd>${nv(r.ruido, 0)}</dd><dd>${r.solo == null ? "—" : nv(r.solo, 0) + " %"}</dd></dl>
    ${r.solo < LIM.solo ? `<p class="ocorr seco">${esc(t("ges.ch_seco", { v: Math.round(r.solo) }))}</p>` : ""}
    ${r.ruido > LIM.ruido ? `<p class="ocorr seco">${esc(t("ges.ch_ruido", { v: Math.round(r.ruido) }))}</p>` : ""}
    ${av ? `<p class="ocorr">${esc(t("ges.ch_avaria", { id: av.id, circuito: dado("texto", av.circuito), tipo: dado("texto", av.tipo_lampada) }))}</p>` : ""}
    <div class="acoes"><button class="btn forte" type="button" data-a="ir">${esc(t("ges.ch_ir"))}</button><button class="btn" type="button" data-a="control">${esc(t("ges.ch_control"))}</button></div>`;
  c.toggleAttribute("data-on", true);
  c.querySelector(".fecha").addEventListener("click", fechaChamada);
  c.querySelector('[data-a="ir"]').addEventListener("click", () => {
    const v = VISTA_DA_REGIAO[nome];
    if (v) irVista(v);
    else { mod.gemeo?.irPara(r.lums.map((p) => [p.x, p.y, p.z])); marcaDestino(null); }
  });
  c.querySelector('[data-a="control"]').addEventListener("click", () => { fechaChamada(); mostra("control"); });
}
function fechaChamada() {
  const c = $("#chamada");
  if (!c.hasAttribute("data-on")) return;
  c.removeAttribute("data-on");
  st.regiao = null;
  document.querySelectorAll("#corpo tr.linha[data-regiao]").forEach((x) => x.setAttribute("aria-selected", "false"));
}
addEventListener("keydown", (e) => { if (e.key === "Escape" && !document.body.classList.contains("passeio-ativo")) fechaChamada(); });

// ---------------------------------------------------------------- separador Control (painel do gestor em iframe)
function abreControlo() {
  const f = $("#controloQuadro");
  const src = `painel.html?embutido=1&lang=${lang}${params.get("ativos") ? `&ativos=${encodeURIComponent(params.get("ativos"))}` : ""}`;
  if (f.dataset.src !== src) { f.src = src; f.dataset.src = src; }
  $("#controloAparte").href = `painel.html?lang=${lang}${params.get("ativos") ? `&ativos=${encodeURIComponent(params.get("ativos"))}` : ""}`;
}
// enquanto o Control está à vista, o gêmeo relê as camadas de segundo a segundo
function rapidoAtivos() { mod.ativos?.rapido(st.app === "gestion" && st.q.gestion === "control"); }

// ---------------------------------------------------------------- entrada
function desenhaEntrada() {
  // contagens fixas do resumo de data/parque.json; quando o gêmeo já está carregado (voltar à entrada), as avarias ao vivo
  const R = st.resumo, rs = regioes(), T = totais(rs), nP = R?.portas, nPas = R?.paseos, nLum = rs.length ? T.n : R?.luminarias;
  $("#vVisita").textContent = nP && nPas ? t("ent.v_visita", { portas: nP, paseos: nPas, zonas: ZONAS_MODELADAS }) : "";
  $("#vGestao").textContent = rs.length ? t(T.avariadas === 1 ? "ent.v_gestion1" : "ent.v_gestion", { av: T.avariadas, avisos: T.avisos, lig: T.ligadas, n: T.n })
    : R ? t("ent.v_gestion_est", { n: R.luminarias, s: R.sensores }) : "";
  $("#plLegenda").textContent = R ? t("pl.leg", { n: R.arvores }) : "";
  $("#numeros").innerHTML = [["ent.n_zonas", ZONAS_MODELADAS], ["ent.n_luces", nLum], ["ent.n_puertas", nP], ["ent.n_paseos", nPas]]
    .map(([k, v]) => `<div><span class="rot">${esc(t(k))}</span><b>${v == null ? "—" : fmt.num(v)}</b></div>`).join("");
  document.title = t("doc.titulo");
}
document.querySelectorAll(".partidas a[data-ir]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); irApp(a.dataset.ir); }));
$("#marcaApp").addEventListener("click", (e) => { e.preventDefault(); irApp("inicio"); });

// ---------------------------------------------------------------- dados e módulos
addEventListener("retiro:ativos", (e) => {
  st.ativos = e.detail;
  if (st.app === "inicio") { desenhaEntrada(); return; }
  if (st.app !== "gestion") return;
  desenhaPlacar();
  marcaAtencao();
  if (st.q.gestion === "operacao" || st.q.gestion === "camadas") redesenhaCorpo();
  if (st.regiao && $("#chamada").hasAttribute("data-on")) abreChamada(st.regiao);
});
addEventListener("retiro:idioma", () => {
  desenhaDestinos();
  if (st.app === "inicio") desenhaEntrada(); else desenhaApp();
  if (st.regiao) abreChamada(st.regiao);
  if (st.q.gestion === "control" && $("#controloQuadro").dataset.src) abreControlo();
});
fetch("data/mobilidade/portas.geojson").then((r) => r.json()).then((g) => {
  st.portas = g.features;
  if (st.app === "inicio") desenhaEntrada(); else if (st.q[st.app] === "chegar") redesenhaCorpo();
}).catch(() => { st.portas = []; });

// ---------------------------------------------------------------- vista ampliada (só o 3D)
// Esconde o quadro, as pílulas e a chamada; o mapa ocupa o ecrã. Se o navegador deixar, pede também ecrã inteiro
// (o Safari do iPhone não deixa em páginas normais: aí fica só o modo da página). Sai pelo botão, Esc ou "voltar".
// Passeio e hora continuam a correr. O estado fica só nesta sessão do navegador (sessionStorage).
let ampliado = false;
function poeAmpliado(v, { historia = true } = {}) {
  v = !!v && st.app !== "inicio";
  if (v === ampliado) return;
  ampliado = v;
  document.body.classList.toggle("ampliado", v);
  $("#ampliar").setAttribute("aria-pressed", String(v));
  try { sessionStorage.setItem("retiro-ampliado", v ? "1" : "0"); } catch { /* sem armazenamento */ }
  if (v) {
    fechaChamada();
    if (historia) history.pushState({ ampliado: true }, "", location.href);
    try { document.documentElement.requestFullscreen?.({ navigationUI: "hide" })?.catch?.(() => {}); } catch { /* não deixa */ }
    $("#ampliarSair").focus({ preventScroll: true });
  } else {
    try { if (document.fullscreenElement) document.exitFullscreen?.()?.catch?.(() => {}); } catch { /* já saiu */ }
    if (historia && history.state?.ampliado) history.back();
    $("#ampliar").focus({ preventScroll: true });
  }
}
function sairAmpliado() { poeAmpliado(false); }
$("#ampliar").addEventListener("click", () => poeAmpliado(true));
$("#ampliarSair").addEventListener("click", () => poeAmpliado(false));
addEventListener("popstate", () => { if (ampliado) poeAmpliado(false, { historia: false }); });
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && ampliado) poeAmpliado(false); });
// Esc sai primeiro da vista ampliada (antes do passeio, que também usa Esc para sair)
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && ampliado) { e.stopImmediatePropagation(); e.preventDefault(); poeAmpliado(false); }
}, true);

// ---------------------------------------------------------------- 3D a pedido
// O SDK (~1 MB) e a cena 3D só se carregam aqui: ao entrar na Gestión, ou na Visita em 3D, ou quando uma ação precisa
// do 3D (passeio, transporte no mapa). Depois de carregado fica (voltar ao plano só o esconde).
const espera = {};                       // módulo -> funções à espera que ele se registe
const quando = (nome) => (mod[nome] !== null && mod[nome] !== undefined) ? Promise.resolve(mod[nome]) : new Promise((ok) => (espera[nome] ??= []).push(ok));
let a3D = null;
function garantir3D() {
  if (a3D) return a3D;
  poeTexto($("#estado"), "est.carregar");
  a3D = (async () => {
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://js.arcgis.com/5.0/esri/themes/light/main.css";
    document.head.appendChild(css);
    const sdk = document.createElement("script");
    sdk.type = "module"; sdk.src = "https://js.arcgis.com/5.0/";
    document.head.appendChild(sdk);
    await new Promise((ok, erro) => { sdk.onerror = () => erro(new Error("SDK")); const v = () => (window.$arcgis ? ok() : setTimeout(v, 30)); v(); });
    await import("./main.js");
  })();
  a3D.catch((e) => { console.error("3D", e); poeTexto($("#estado"), "est.falhou", { lista: "SDK" }); a3D = null; });
  return a3D;
}
// ---------------------------------------------------------------- plano 2D (entrada e Visita em 2D)
let plano = null, aPlano = null;
function garantirPlano() {
  if (aPlano) return aPlano;
  const t0 = performance.now();
  aPlano = carregarPlano().then((d) => {
    st.resumo = d.resumo;
    plano = montarPlano($("#plano"), d, {
      aoEscolher: () => $("#plDica").classList.add("fora"),
      aoAcao: (tipo, s) => {
        if (tipo === "porta") {          // como chegar: Visita › Llegar, com a porta escolhida no plano
          if (st.app !== "visita") irApp("visita");
          mostra("chegar");
          plano.irPonto(s.x, s.y, 320);
        } else if (tipo === "zona") {    // ver em 3D: Visita em 3D, na vista da zona
          st.vista = ZONA_PARA_VISTA[s.z] ?? "estanque";
          if (st.app !== "visita") irApp("visita");
          poeMotor("3d");
          irVista(st.vista);
        }
      },
    });
    plano.camada("arte", st.app !== "inicio"); plano.camada("zonas", st.app !== "inicio");
    window.plano2d = plano;
    if (st.app === "inicio") desenhaEntrada();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.entrada_pronta_ms = Math.round(performance.now()); window.plano_ms = Math.round(performance.now() - t0); }));
    return plano;
  }).catch((e) => { console.error("plano 2D", e); aPlano = null; });
  return aPlano;
}
document.querySelectorAll("[data-pl-camada]").forEach((b) => b.addEventListener("click", () => {
  const on = b.getAttribute("aria-pressed") !== "true";
  b.setAttribute("aria-pressed", String(on));
  plano?.camada(b.dataset.plCamada, on);
}));
document.querySelectorAll("[data-pl-zoom]").forEach((b) => b.addEventListener("click", () => {
  if (b.dataset.plZoom === "todo") plano?.inteiro(); else plano?.zoom(b.dataset.plZoom === "mais" ? 2 : 0.5);
}));
// ---------------------------------------------------------------- Plano / 3D
function aplicaMotor() {
  if (!st.motor && st.app !== "inicio") st.motor = CELULAR.matches ? "2d" : "3d";
  const m = st.app === "gestion" ? "3d" : st.motor;
  document.body.classList.toggle("motor-2d", st.app !== "inicio" && m === "2d");
  document.querySelectorAll("#motor [data-motor]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.motor === m)));
  if (st.app === "inicio") { garantirPlano(); return; }
  if (m === "3d") garantir3D();
  else {
    garantirPlano().then(() => { plano?.camada("arte", true); plano?.camada("zonas", true); irVista(st.vista); });
    if (!a3D) poeTexto($("#estado"), "est.plano");
  }
}
function poeMotor(m) {
  if (m === st.motor && document.body.classList.contains("motor-2d") === (m === "2d")) return;
  st.motor = m;
  poeUrl();
  aplicaMotor();
  if (m === "3d" && mod.gemeo) mod.gemeo.irVista(st.vista === "mobilidade" ? "mobilidade" : st.vista);
  if (st.q[st.app] === "passeios" || st.q[st.app] === "chegar") redesenhaCorpo();
}
document.querySelectorAll("#motor [data-motor]").forEach((b) => b.addEventListener("click", () => poeMotor(b.dataset.motor)));

export const casca = {
  registar(nome, api) {
    mod[nome] = api;
    if (nome === "passeio" && !api) st.passeioFalhou = true;
    if (nome === "gemeo") { api.definirHora(st.hora); marcaDestino(st.vista); if (st.vista !== "estanque" && st.vista !== "mobilidade") api.irVista(st.vista); }
    for (const f of (espera[nome] ?? [])) f(api);
    espera[nome] = [];
    if (nome === "ativos" && api) {
      api.visivelLuz(st.camadas.ilum); api.visivelSensores(st.camadas.sens); rapidoAtivos();
    }
    if (nome === "mobilidade" && api) { desenhaDestinos(); if (st.camadas.mob) api.ligar(true); }
    if (st.app === "inicio") desenhaEntrada(); else redesenhaCorpo();
  },
  estado: () => ({ app: st.app, q: st.q[st.app], vista: st.vista, hora: st.hora, camadas: { ...st.camadas } }),
  irApp, mostra, irVista, ampliar: poeAmpliado, motor: poeMotor,
};
window.casca = casca;

// ---------------------------------------------------------------- arranque
document.querySelectorAll("[data-idioma]").forEach((el) => seletorIdioma(el));
aplicar();
desenhaDestinos();
definirHora(Number(params.get("hora")) || 16);
garantirPlano();
irApp(st.app);
try { if (sessionStorage.getItem("retiro-ampliado") === "1") poeAmpliado(true, { historia: false }); } catch { /* sem armazenamento */ }
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("inicio")));
