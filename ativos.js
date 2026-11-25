// Cliente das camadas de ativos: fala o protocolo REST de um Feature Service (query / applyEdits, f=json).
// É a única coisa que o painel e o gêmeo partilham; nenhum dos dois fala com o outro.
// Em modo demonstração (config.DEMO) não há servidor: as mesmas duas funções respondem a partir de uma fotografia
// estática (data/ativos_demo.json), as edições ficam neste navegador (localStorage, partilhado entre o gêmeo e o
// painel embutido; em memória se o armazenamento falhar) e as leituras dos sensores simulam-se aqui.
import { ATIVOS_URL, DEMO } from "./config.js";

export { DEMO };

async function pedir(url, corpo) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(url, corpo ? { method: "POST", body: corpo, signal: ctl.signal } : { signal: ctl.signal, cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || "erro do serviço");
    return d;
  } finally {
    clearTimeout(t);
  }
}

// -> [{ ...atributos, x, y, z }]
export async function consultar(camada, where = "1=1") {
  if (DEMO) return demoConsultar(camada, where);
  const q = new URLSearchParams({ where, outFields: "*", returnGeometry: "true", returnZ: "true", outSR: "25830", f: "json" });
  const d = await pedir(`${ATIVOS_URL}/${camada}/query?${q}`);
  return d.features.map((f) => ({ ...f.attributes, x: f.geometry.x, y: f.geometry.y, z: f.geometry.z ?? 0 }));
}

// updates: [{ OBJECTID, campo: valor, ... }] -> lista de resultados { objectId, success }
export async function aplicarEdicoes(camada, updates) {
  if (DEMO) return demoEditar(camada, updates);
  const corpo = new URLSearchParams({ f: "json", updates: JSON.stringify(updates.map((attributes) => ({ attributes }))) });
  const d = await pedir(`${ATIVOS_URL}/${camada}/applyEdits`, corpo);
  return d.updateResults ?? [];
}

// ---------------------------------------------------------------- modo demonstração
// Regras iguais às de scripts/ativos_server.py (campos editáveis, estados, intensidade 0-100, where simples com AND).
const CHAVE = "retiro-ativos-demo-v1";
const EDITAVEIS = { 0: ["estado", "intensidade"], 1: [] };
const ESTADOS = ["ligado", "desligado", "avariado"];
// leituras: base da fotografia + duas ondas lentas por sensor, limitadas; o tempo é contado em passos de 5 s, por isso
// o gêmeo e o painel (duas páginas) mostram o mesmo valor à mesma hora sem falarem um com o outro
const SIM = { temperatura: [8, 34, 1.6], ruido: [38, 78, 9], humidade_solo: [12, 55, 3] };
const PASSO_MS = 5000;
let foto = null;
let memoria = {}; // edições quando o localStorage não está disponível

function carregar() {
  foto ??= fetch(new URL("data/ativos_demo.json", import.meta.url)).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).catch((e) => { foto = null; throw e; });
  return foto;
}
function lerEdicoes() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || "{}"); } catch { return memoria; }
}
function gravarEdicoes(e) {
  memoria = e;
  try { localStorage.setItem(CHAVE, JSON.stringify(e)); } catch { /* fica em memória */ }
}

function filtro(camada, campos, where) {
  const testes = [];
  for (const parte of String(where || "1=1").trim().split(/\s+AND\s+/i)) {
    if (parte.replace(/\s/g, "") === "1=1") continue;
    const m = parte.match(/^\s*(\w+)\s*=\s*(?:'((?:[^']|'')*)'|(-?\d+(?:\.\d+)?))\s*$/);
    if (!m || !campos.has(m[1])) throw new Error(`where não suportado: ${parte}`);
    testes.push([m[1], m[2] != null ? m[2].replace(/''/g, "'") : Number(m[3])]);
  }
  return (a) => testes.every(([c, v]) => (typeof v === "number" ? Number(a[c]) : a[c]) === v);
}

function leitura(a, passo) {
  const [lo, hi, amp] = SIM[a.tipo] ?? [-Infinity, Infinity, 0];
  const f = (a.OBJECTID * 2.399) % (2 * Math.PI);
  const v = a.leitura + amp * (0.65 * Math.sin(passo / 37 + f) + 0.35 * Math.sin(passo / 9.3 + 2 * f));
  return Math.round(Math.min(hi, Math.max(lo, v)) * 10) / 10;
}

async function demoConsultar(camada, where) {
  const fs = (await carregar()).camadas[camada];
  if (!fs) throw new Error("camada inexistente");
  const passa = filtro(camada, new Set(fs.fields.map((f) => f.name)), where);
  const ed = lerEdicoes()[camada] || {};
  const passo = Math.floor(Date.now() / PASSO_MS);
  const out = [];
  for (const f of fs.features) {
    const a = { ...f.attributes, ...(ed[f.attributes.OBJECTID] || {}) };
    if (camada === 1 && a.leitura != null) { a.leitura = leitura(f.attributes, passo); a.hora_leitura = passo * PASSO_MS; }
    if (passa(a)) out.push({ ...a, x: f.geometry.x, y: f.geometry.y, z: f.geometry.z ?? 0 });
  }
  return out;
}

async function demoEditar(camada, updates) {
  const fs = (await carregar()).camadas[camada];
  if (!fs) throw new Error("camada inexistente");
  const ids = new Set(fs.features.map((f) => f.attributes.OBJECTID));
  const todas = lerEdicoes();
  const ed = (todas[camada] ??= {});
  const res = [];
  for (const a of updates) {
    const oid = a?.OBJECTID;
    let erro = ids.has(oid) ? null : "OBJECTID inexistente";
    for (const [k, v] of Object.entries(a || {})) {
      if (erro || k === "OBJECTID") continue;
      if (!EDITAVEIS[camada]?.includes(k)) erro = `campo não editável: ${k}`;
      else if (k === "estado" && !ESTADOS.includes(v)) erro = "estado inválido";
      else if (k === "intensidade" && !(Number.isInteger(v) && v >= 0 && v <= 100)) erro = "intensidade fora de 0-100";
    }
    if (erro) { res.push({ objectId: oid, success: false, error: { code: 400, description: erro } }); continue; }
    const { OBJECTID: _o, ...campos } = a;
    ed[oid] = { ...(ed[oid] || {}), ...campos };
    res.push({ objectId: oid, success: true });
  }
  if (res.some((r) => r.success)) gravarEdicoes(todas);
  return res;
}

// repõe o estado da fotografia (só neste navegador)
export function repor() { gravarEdicoes({}); }

// aviso discreto nas páginas que mostram ativos (elementos com data-demo-aviso)
if (DEMO && typeof document !== "undefined") {
  for (const el of document.querySelectorAll("[data-demo-aviso]")) el.hidden = false;
}
