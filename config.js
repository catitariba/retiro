// Único sítio onde vive o endereço das camadas de ativos (luminárias e sensores).
// Teste local: scripts/ativos_server.py na porta 8793 da mesma máquina que serve a página.
// Para passar ao ArcGIS Online basta pôr aqui o endereço do Feature Service (…/FeatureServer) e os índices das camadas.
// ?ativos=<endereço> sobrepõe-se; ?ativos=off desliga os ativos no gêmeo.
// Modo demonstração (?ativos=demo, ou automático fora de localhost / rede local, p. ex. GitHub Pages): sem servidor;
// ativos.js lê data/ativos_demo.json (scripts/ativos_demo.py) e as edições ficam só neste navegador.
const p = new URLSearchParams(location.search);
const h = location.hostname;
const NA_MAQUINA = !h || h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".localhost")
  || /^(10\.\d+|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+$/.test(h); // rede local: o celular na mesma Wi-Fi
const local = `${location.protocol}//${h || "localhost"}:8793/ativos/rest/services/Retiro/FeatureServer`;

export const DEMO = p.get("ativos") === "demo" || (!p.get("ativos") && !NA_MAQUINA);
export const ATIVOS_URL = p.get("ativos") === "off" ? null : DEMO ? "demo" : (p.get("ativos") || local);
export const CAMADA = { luminarias: 0, sensores: 1 };
export const INTERVALO_MS = 4000; // releitura das camadas

// Mobilidade: disponibilidade do BiciMAD em tempo real (GBFS público, sem chave nem registo). É o único pedido
// que o visor faz para fora da máquina, e só ao abrir o popup de uma estação. ?bicimad=off desliga-o.
export const BICIMAD_GBFS = p.get("bicimad") === "off" ? null : "https://madrid.publicbikesystem.net/customer/gbfs/v2/en/station_status";
