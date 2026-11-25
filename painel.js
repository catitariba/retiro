// Painel do gestor: lê e escreve só nas camadas de ativos (nunca fala com o gêmeo).
// Tudo agrupado por região: com o parque inteiro são mais de mil postes, por isso as listas só se abrem a pedido.
import { ATIVOS_URL, CAMADA, INTERVALO_MS } from "./config.js";
import { consultar, aplicarEdicoes, DEMO, repor } from "./ativos.js";
import { t, dado, fmt, aplicar, poeTexto, seletorIdioma, lang } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...filhos) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...filhos.filter((f) => f != null));
  return e;
};
const TIPOS = ["temperatura", "ruido", "humidade_solo"];
const num = (v, casas = 1) => fmt.num(v, casas);
const embutido = new URLSearchParams(location.search).has("embutido");
document.body.classList.toggle("embutido", embutido);

seletorIdioma($("idioma"));
aplicar();
const titulo = () => { document.title = t("doc.painel"); $("abrirGemeo").href = `index.html?app=gestion&lang=${lang}`; };
titulo();
// ao mudar de idioma: os textos fixos já foram retraduzidos (data-i18n); as linhas refazem-se
addEventListener("retiro:idioma", () => {
  titulo();
  for (const r of regioes.values()) r.det.remove();
  for (const r of sensReg.values()) r.det.remove();
  regioes.clear(); sensReg.clear(); linhas.clear();
  desenhar();
});

let postes = [];
let sensores = [];
const regioes = new Map(); // nome -> nós da região (criados uma vez; depois só mudam os textos)
const sensReg = new Map(); // nome -> nós do bloco de sensores da região
const linhas = new Map(); // OBJECTID -> nós da linha do poste (só existem para regiões já abertas)
const pendentes = new Map(); // OBJECTID -> campos ainda por confirmar pelo servidor (a releitura não os repõe)

function ligacao(ok, chave, vars) {
  $("ligacao").dataset.ok = ok ? "sim" : "nao";
  poeTexto($("ligacao"), chave, vars);
}

async function editar(updates) {
  if (!updates.length) return;
  // otimista: o ecrã muda já; a releitura seguinte confirma (ou repõe, se o servidor recusar)
  const porId = new Map(postes.map((p) => [p.OBJECTID, p]));
  for (const u of updates) {
    Object.assign(porId.get(u.OBJECTID) ?? {}, u);
    pendentes.set(u.OBJECTID, { ...(pendentes.get(u.OBJECTID) || {}), ...u });
  }
  desenhar();
  try {
    const res = await aplicarEdicoes(CAMADA.luminarias, updates);
    const falhas = res.filter((r) => !r.success).length;
    if (falhas) ligacao(false, "pai.recusadas", { n: falhas });
  } catch {
    ligacao(false, "pai.sem_gravar");
  }
  for (const u of updates) pendentes.delete(u.OBJECTID);
  await reler();
}
const todos = (membros, estado) => editar(membros.filter((p) => p.estado !== "avariado" && p.estado !== estado)
  .map((p) => ({ OBJECTID: p.OBJECTID, estado })));
const botao = (texto, acao) => {
  const b = el("button", { type: "button", textContent: texto });
  b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); acao(); });
  return b;
};
const contagem = (m) => {
  const acesos = m.filter((p) => p.estado === "ligado").length, avar = m.filter((p) => p.estado === "avariado").length;
  return t("pai.contagem", { a: acesos, n: m.length }) + (avar ? t(avar > 1 ? "pai.avariadosN" : "pai.avariados1", { n: avar }) : "");
};

// ---------------------------------------------------------------- postes
function linhaPoste(p) {
  const int = el("input", { type: "checkbox", role: "switch" });
  int.setAttribute("aria-label", t("pai.lig_desl", { id: p.id }));
  int.addEventListener("change", () => editar([{ OBJECTID: p.OBJECTID, estado: int.checked ? "ligado" : "desligado" }]));
  const cursor = el("input", { type: "range", min: 0, max: 100, step: 5 });
  cursor.setAttribute("aria-label", t("pai.int_de", { id: p.id }));
  const pct = el("output");
  cursor.addEventListener("input", () => { pct.textContent = `${cursor.value} %`; });
  cursor.addEventListener("change", () => editar([{ OBJECTID: p.OBJECTID, intensidade: Number(cursor.value) }]));
  const avaria = botao(t("pai.avaria"), () => {
    const atual = postes.find((x) => x.OBJECTID === p.OBJECTID);
    editar([{ OBJECTID: p.OBJECTID, estado: atual.estado === "avariado" ? "desligado" : "avariado" }]);
  });
  const sub = el("span", { className: "sub" });
  const li = el("li", {},
    el("span", { className: "nome" }, p.id, sub),
    el("label", { className: "int" }, int, el("span")),
    el("div", { className: "intens" }, cursor, pct),
    avaria);
  return { li, int, cursor, pct, avaria, sub };
}

function novaRegiao(nome) {
  const sub = el("span", { className: "sub" });
  const circuitos = el("ul", { className: "lista circ" });
  const lista = el("ul", { className: "lista postes" });
  const vazio = el("p", { className: "vazio", textContent: t("pai.vazio"), hidden: true });
  const membros = () => postes.filter((p) => p.regiao === nome);
  const det = el("details", { className: "regiao" },
    el("summary", {},
      el("span", { className: "nome" }, dado("texto", nome), sub),
      botao(t("pai.ligar"), () => todos(membros(), "ligado")),
      botao(t("pai.desligar"), () => todos(membros(), "desligado"))),
    circuitos, lista, vazio);
  det.addEventListener("toggle", desenhar);
  return { det, sub, circuitos, lista, vazio, circ: new Map() };
}

function desenharPostes() {
  const n = (e) => postes.filter((p) => p.estado === e).length;
  const w = postes.filter((p) => p.estado === "ligado").reduce((s, p) => s + p.potencia_w * p.intensidade / 100, 0);
  $("resumo").replaceChildren(...[
    [t("pai.ligados"), num(n("ligado"), 0)], [t("pai.desligados"), num(n("desligado"), 0)], [t("pai.avariados"), num(n("avariado"), 0)],
    [t("pai.pot_ligada"), `${num(w / 1000, 2)} kW`],
  ].map(([t, v]) => el("div", {}, el("dt", { textContent: t }), el("dd", { textContent: v }))));

  const fe = $("fEstado").value;
  const nomes = [...new Set(postes.map((p) => p.regiao))].sort((a, b) => a.localeCompare(b, "pt"));
  for (const nome of nomes) {
    let r = regioes.get(nome);
    if (!r) { r = novaRegiao(nome); regioes.set(nome, r); $("regioes").append(r.det); }
    const m = postes.filter((p) => p.regiao === nome);
    const kw = m.filter((p) => p.estado === "ligado").reduce((s, p) => s + p.potencia_w * p.intensidade / 100, 0) / 1000;
    r.sub.textContent = `${contagem(m)} · ${num(kw, 2)} kW`;
    r.det.dataset.avaria = String(m.some((p) => p.estado === "avariado"));
    if (!r.det.open) continue;                 // região fechada: não se criam nem atualizam as suas linhas
    // circuitos (só quando a região tem mais de um)
    const cs = [...new Set(m.map((p) => p.circuito))].sort();
    if (cs.length > 1) {
      for (const c of cs) {
        let li = r.circ.get(c);
        if (!li) {
          const s = el("span", { className: "sub" });
          const mc = () => postes.filter((p) => p.circuito === c);
          li = { s, li: el("li", {}, el("span", { className: "nome" }, t("pai.circuito", { c: dado("texto", c.replace(nome + " · ", "")) }), s),
            botao(t("pai.ligar"), () => todos(mc(), "ligado")), botao(t("pai.desligar"), () => todos(mc(), "desligado"))) };
          r.circ.set(c, li);
          r.circuitos.append(li.li);
        }
        li.s.textContent = contagem(m.filter((p) => p.circuito === c));
      }
    }
    let visiveis = 0;
    for (const p of m) {
      let l = linhas.get(p.OBJECTID);
      if (!l) { l = linhaPoste(p); linhas.set(p.OBJECTID, l); r.lista.append(l.li); }
      const mostra = !fe || p.estado === fe;
      l.li.hidden = !mostra;
      if (mostra) visiveis++;
      l.li.dataset.estado = p.estado;
      l.sub.textContent = `${p.circuito !== nome ? t("pai.circuito_min", { c: dado("texto", p.circuito.replace(nome + " · ", "")) }) + " · " : ""}${dado("texto", p.tipo_lampada)} · ~${p.potencia_w} W · ${dado("origem", p.origem)}`;
      l.int.checked = p.estado === "ligado";
      l.int.disabled = p.estado === "avariado";
      l.avaria.setAttribute("aria-pressed", String(p.estado === "avariado"));
      if (document.activeElement !== l.cursor) { l.cursor.value = p.intensidade; l.pct.textContent = `${p.intensidade} %`; }
      l.cursor.disabled = p.estado === "avariado";
    }
    r.vazio.hidden = visiveis > 0;
  }
}

// ---------------------------------------------------------------- sensores, agregados por região
function desenharSensores() {
  const nomes = [...new Set(sensores.map((s) => s.regiao))].sort((a, b) => a.localeCompare(b, "pt"));
  for (const nome of nomes) {
    let r = sensReg.get(nome);
    if (!r) {
      const medias = el("span", { className: "medias" });
      const lista = el("ul", { className: "lista leituras" });
      const det = el("details", { className: "regiao sens" }, el("summary", {}, el("span", { className: "nome" }, dado("texto", nome)), medias), lista);
      det.addEventListener("toggle", desenharSensores);
      r = { det, medias, lista };
      sensReg.set(nome, r);
      $("sensores").append(det);
    }
    const m = sensores.filter((s) => s.regiao === nome);
    r.medias.replaceChildren(...TIPOS.map((tipo) => {
      const ts = m.filter((s) => s.tipo === tipo), rotulo = dado("sensor", tipo);
      if (!ts.length) return null;
      const media = ts.reduce((a, s) => a + s.leitura, 0) / ts.length;
      return el("span", { className: `chip ${tipo}`, title: t("pai.media", { t: rotulo, n: ts.length }) },
        el("small", { textContent: rotulo }), `${num(media)} ${ts[0].unidade}`);
    }).filter(Boolean));
    if (!r.det.open) continue;
    r.lista.replaceChildren(...m.map((s) => el("li", {},
      el("span", { className: "nome" }, s.id, el("span", { className: "sub", textContent: dado("sensor", s.tipo) })),
      el("span", { className: "val", textContent: `${num(s.leitura)} ${s.unidade}` }),
      el("span", { className: "hora", textContent: fmt.relogio(s.hora_leitura) }))));
  }
  $("nSens").textContent = sensores.length ? t("pai.n_sens", { n: sensores.length, r: nomes.length }) : "";
}

function desenhar() { desenharPostes(); desenharSensores(); }

let aLer = false;
async function reler() {
  if (aLer) return;
  aLer = true;
  try {
    const [p, s] = await Promise.all([consultar(CAMADA.luminarias), consultar(CAMADA.sensores)]);
    for (const x of p) Object.assign(x, pendentes.get(x.OBJECTID) || {});
    postes = p.sort((a, b) => a.OBJECTID - b.OBJECTID);
    sensores = s;
    ligacao(true, DEMO ? "pai.ligado_demo" : "pai.ligado", { p: postes.length, s: sensores.length });
    desenhar();
  } catch {
    ligacao(false, "pai.sem");
  }
  aLer = false;
}

$("fEstado").addEventListener("change", desenhar);
$("todosOn").addEventListener("click", () => todos(postes, "ligado"));
$("todosOff").addEventListener("click", () => todos(postes, "desligado"));
$("demoRepor")?.addEventListener("click", () => { repor(); reler(); }); // modo demonstração: volta à fotografia
if (ATIVOS_URL) {
  reler();
  setInterval(() => { if (!document.hidden) reler(); }, INTERVALO_MS);
} else {
  ligacao(false, "pai.off");
}
