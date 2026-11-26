// Todos os textos da interface do visor e do painel do gestor, em espanhol (por omissão) e inglês.
// Nomes próprios do parque ficam em espanhol nos dois idiomas. Os valores que vêm das camadas e dos dados
// (estados, regiões, tipos de paragem…) são traduzidos à vista por dado(); o que se guarda nas camadas não muda.
// Escolha do idioma: ?lang=es|en > localStorage["retiro-lang"] > es. Mudar de idioma não recarrega a cena:
// os elementos com data-i18n são retraduzidos e os módulos ouvem o evento "retiro:idioma".

const ES = {
  "doc.titulo": "Retiro · Gemelo digital",
  "doc.painel": "Retiro · Panel del gestor",
  "idioma.rot": "Idioma",
  "marca.sub": "Gemelo digital",
  "app.visita": "Visita",
  "app.gestion": "Gestión",
  "app.volver": "Volver a la entrada",

  // entrada
  "ent.topo": "Gemelo digital · Madrid",
  "ent.lamina": "Lámina 01 · Ahuehuete del Parterre",
  "ent.lamina_alt": "Ahuehuete, grabado",
  "ent.h1": "El Retiro, <em>pieza a pieza.</em>",
  "ent.p": "Un modelo 3D del parque hecho con datos reales: terreno, árboles, monumentos, la verja y las puertas, y el alumbrado. Los sensores, por ahora, son simulados.",
  "ent.visita_d": "Llegar en metro, pasear a la altura de los ojos, ver las zonas a cualquier hora.",
  "ent.gestion_d": "Alumbrado, sensores y movilidad, ordenados por lo que pide atención.",
  "ent.entrar": "Entrar ›",
  "ent.reservado": "Acceso reservado",
  "ent.fauna": "Quién vive en el Retiro",
  "ent.pato_d": "En el Estanque, todo el año.",
  "ent.pavo_d": "Jardines de Cecilio Rodríguez.",
  "ent.cotorra_d": "En las copas altas, en bandada.",
  "ent.n_zonas": "Zonas modeladas",
  "ent.n_luces": "Luminarias",
  "ent.n_puertas": "Puertas",
  "ent.n_paseos": "Paseos",
  "ent.rod": "Sensores simulados y potencia estimada; el bronce del Ángel Caído es un modelo generado por IA.",
  "ent.heroi_alt": "Ilustración en papel recortado del Estanque del Retiro, con el monumento a Alfonso XII y el Palacio de Cristal",
  "ent.heroi_leg": "El Estanque, el monumento a Alfonso XII y el Palacio de Cristal, en papel recortado. Composición libre, no a escala.",
  "ent.vista01": "Vista 01",
  "ent.v_visita": "{portas} puertas · {paseos} paseos · {zonas} zonas",
  "ent.v_gestion": "{av} averías · {avisos} avisos · {lig}/{n} luces",
  "ent.v_gestion1": "{av} avería · {avisos} avisos · {lig}/{n} luces",
  "ent.v_gestion_est": "{n} luminarias · {s} sensores simulados",

  // hora
  "hora.ver": "Ver a las",
  "hora.rot": "Hora",
  "hora.agora": "Ahora",
  "hora.aria": "Hora {h}",
  "hora.cursor": "Hora del día",

  // destinos (vistas de câmara)
  "vista.grupo": "Vistas",
  "vista.parque": "Parque",
  "vista.estanque": "Estanque",
  "vista.monumento": "Monumento",
  "vista.passeio": "Estanque, a pie",
  "vista.cristal": "Cristal",
  "vista.velazquez": "Velázquez",
  "vista.rosaleda": "Rosaleda",
  "vista.parterre": "Parterre",
  "vista.estatuas": "Estatuas",
  "vista.vacas": "Casa de Vacas",
  "vista.cecilio": "Cecilio Rodríguez",
  "vista.independencia": "P. Independencia",
  "vista.angel": "Ángel Caído",
  "vista.mobilidade": "Transporte",

  // visita
  "vis.tabs": "Secciones de la visita",
  "vis.chegar": "Llegar",
  "vis.passeios": "Paseos",
  "vis.zonas": "Zonas",
  "vis.natureza": "Naturaleza",
  "vis.ch_tit": "Puertas · metro más cercano",
  "vis.ch_tit2": "a pie, en línea recta",
  "vis.th_porta": "Puerta",
  "vis.th_metro": "Metro",
  "vis.th_pe": "A pie",
  "vis.th_bus": "Autobús",
  "vis.min": "{n} min",
  "vis.ch_rod": "Puertas y estaciones de OpenStreetMap y del CRTM; distancias medidas en el modelo, en línea recta. Sin horarios ni esperas reales. Tocar una puerta lleva la cámara hasta ella.",
  "vis.ch_cargando": "Cargando las puertas…",
  "vis.transporte": "Transporte en el mapa",
  "vis.transporte_s": "Metro, Cercanías, autobús, BiciMAD y más, alrededor de las puertas",
  "vis.pa_tit": "Paseos a la altura de los ojos",
  "vis.pa_tit2": "1,3 m/s",
  "vis.th_percurso": "Recorrido",
  "vis.th_km": "km",
  "vis.th_min": "Min",
  "vis.partir": "Empezar ›",
  "vis.livre": "Andar libre",
  "vis.livre_s": "Teclas W A S D o flechas; en el móvil, botones",
  "vis.pa_rod": "El paseo recorre el modelo a la altura de los ojos; el panel se recoge y queda solo el recorrido. Arrastrar en el mapa mira alrededor; Esc sale.",
  "vis.pa_cargando": "Cargando los recorridos…",
  "vis.pa_falta": "El modo paseo no cargó.",
  "vis.zo_tit": "Zonas modeladas",
  "vis.zo_tit2": "{n} vistas",
  "vis.ver": "Ver ›",
  "vis.zo_rod": "Cada fila lleva la cámara a su vista. Las mismas vistas están en los botones sobre el mapa.",
  "vis.na_tit": "En el Retiro, en noviembre",
  "vis.na_tit2": "árboles y aves",
  "vis.na_rod": "Especies frecuentes en el parque; los lugares son aproximados y no vienen del inventario municipal. Ilustraciones generadas por IA, no fotografías.",
  "zona.estanque_s": "Monumento a Alfonso XII",
  "zona.rosaleda_s": "y el Ángel Caído",
  "zona.vacas_s": "y el Quiosco de Música",
  "zona.passeio_s": "A pie, en la orilla",
  "zona.mobilidade_s": "El parque y su entorno, con el transporte",

  // natureza
  "nat.ahuehuete": "Ahuehuete", "nat.ahuehuete_o": "Parterre", "nat.ahuehuete_n": "Considerado el árbol más antiguo de Madrid",
  "nat.pato": "Ánade real", "nat.pato_o": "Estanque", "nat.pato_n": "Todo el año en el agua",
  "nat.pavao": "Pavo real", "nat.pavao_o": "Jardines de Cecilio Rodríguez", "nat.pavao_n": "Pasea entre setos y pérgolas",
  "nat.periquito": "Cotorra argentina", "nat.periquito_o": "Copas altas, todo el parque", "nat.periquito_n": "Exótica; hace nidos grandes y colectivos",
  "nat.platano": "Plátano de sombra", "nat.platano_o": "Paseos y avenidas", "nat.platano_n": "En noviembre, hojas amarillas en el suelo",
  "nat.castanheiro": "Castaño de Indias", "nat.castanheiro_o": "Varios puntos del parque", "nat.castanheiro_n": "Erizos y castañas en otoño",

  // passeio (web/passeio.js)
  "pas.painel": "Modo paseo",
  "pas.titulo": "Paseo",
  "pas.sair": "Salir",
  "pas.percurso": "Recorrido",
  "pas.opcao": "{nome} · {km} km",
  "pas.livre": "Andar libre (teclas / botones)",
  "pas.pausa": "Pausa",
  "pas.continuar": "Continuar",
  "pas.recomecar": "Reiniciar",
  "pas.velocidade": "Velocidad",
  "pas.posicao": "Posición en el recorrido",
  "pas.esq": "Girar a la izquierda",
  "pas.frente": "Andar hacia delante",
  "pas.dir": "Girar a la derecha",
  "pas.ladoE": "Paso a la izquierda",
  "pas.tras": "Andar hacia atrás",
  "pas.ladoD": "Paso a la derecha",
  "pas.chegou": "Llegada. Elija otro recorrido o salga.",
  "pas.progresso": "{s} de {L} m · faltan {min} min",
  "pas.livre_info": "Libre · {x}, {y}",

  // gestão
  "ges.tabs": "Secciones de la gestión",
  "ges.operacao": "Operación",
  "ges.control": "Control",
  "ges.camadas": "Capas",
  "ges.p_luzes": "Luces encendidas",
  "ges.p_pot": "Potencia",
  "ges.p_avarias": "Averías",
  "ges.p_avisos": "Avisos",
  "ges.op_tit": "Regiones · por lo que pide atención",
  "ges.op_tit2": "{n} regiones",
  "ges.th_regiao": "Región",
  "ges.th_luzes": "Luces",
  "ges.th_solo": "Suelo",
  "ges.th_estado": "Estado",
  "ges.e_avaria": "{n} avería",
  "ges.e_avarias": "{n} averías",
  "ges.e_ruido": "Ruido alto",
  "ges.e_seco": "Suelo seco",
  "ges.e_ok": "Normal",
  "ges.op_rod": "Sensores simulados; potencia estimada por el tipo de lámpara. Umbrales de esta interfaz, no del servicio: ruido > 70 dB, suelo < 18 %. Se relee cada 4 s.",
  "ges.op_espera": "Esperando las capas de activos…",
  "ges.op_sem": "Sin conexión con el servidor de activos. Las cifras vuelven cuando responda.",
  "ges.op_off": "Activos desactivados (?ativos=off).",
  "ges.ch_regiao": "Región",
  "ges.ch_seco": "Suelo al {v} %, por debajo del umbral (18 %): revisar el riego.",
  "ges.ch_ruido": "Ruido de {v} dB, por encima del umbral (70 dB).",
  "ges.ch_avaria": "{id} averiada · {circuito} · {tipo}",
  "ges.ch_ir": "Ir a la zona",
  "ges.ch_control": "Abrir en Control",
  "ges.ch_fechar": "Cerrar",
  "ges.ca_tit": "En el mapa",
  "ges.ca_tit2": "una fila por capa",
  "ges.th_camada": "Capa",
  "ges.c_ilum": "Iluminación",
  "ges.c_ilum_s": "{n} luminarias · gris = apagada, rojo = averiada",
  "ges.c_sens": "Sensores",
  "ges.c_sens_s": "{n} sensores simulados · temperatura, ruido, humedad del suelo",
  "ges.c_arv": "Árboles",
  "ges.c_arv_s": "Inventario municipal · {n} árboles",
  "ges.c_sombras": "Sombras",
  "ges.c_sombras_s": "Sol del 15 de mayo; sombra de los árboles cercanos a la cámara",
  "ges.c_arte": "Arte público",
  "ges.c_arte_s": "{n} obras con ficha",
  "ges.c_mob": "Movilidad",
  "ges.c_mob_s": "Metro, Cercanías, autobús y BiciMAD cerca de las puertas",
  "ges.li_tit": "Umbrales de aviso",
  "ges.li_tit2": "de esta interfaz",
  "ges.li_ruido": "Ruido",
  "ges.li_solo": "Humedad del suelo",
  "ges.li_apagada": "Luminaria averiada",
  "ges.li_avaria": "avería",
  "ges.ct_titulo": "Panel del gestor",
  "ges.ct_aparte": "Abrir aparte",
  "ges.ct_nota": "El panel escribe en las capas; el mapa las relee cada segundo mientras esta pestaña está abierta.",
  "mob.grupo": "Modos de transporte",
  "mob.autocarro": "Autobús",
  "mob.metro": "Metro",
  "mob.cercanias": "Cercanías",
  "mob.bicimad": "BiciMAD",
  "mob.outros": "Otros",
  "mob.outros_t": "Taxis, aparcamientos, aparcabicis, carriles bici y autobuses interurbanos",
  "rod.dados": "Datos: Ayuntamiento de Madrid (CC BY 4.0) · IGN (CC BY 4.0) · © OpenStreetMap contributors (ODbL) · BiciMAD (EMT Madrid)",

  // estados (linhas de estado)
  "est.carregar": "Cargando el modelo…",
  "est.pronto": "{arv} árboles · {arte} obras de arte",
  "est.falhou": "No cargó: {lista}",
  "atv.desligados": "Activos desactivados",
  "atv.estado": "{n} luminarias ({a} encendidas) · {s} sensores simulados",
  "atv.sem_ligacao": "Activos: sin conexión (último estado conocido)",
  "atv.servidor_off": "Activos: servidor apagado",
  "atv.falhou": "Activos: no cargaron",
  "mob.carregar": "Cargando la movilidad…",
  "mob.estado": "{bus} paradas EMT · {metro} estaciones de metro · {cerc} de Cercanías · {bici} BiciMAD · {portas} puertas",
  "mob.falhou_dados": "Movilidad: los datos no cargaron",
  "mob.falhou": "Movilidad: no cargó",

  // popups do mapa
  "pop.agua": "Agua",
  "pop.agua_cota": "Cota de la lámina de agua: {cota} m",
  "pop.arv_altura": "Altura (m)",
  "pop.arv_perimetro": "Perímetro del tronco (cm)",
  "pop.arv_inv": "N.º de inventario",
  "pop.lum": "Luminaria {id}",
  "pop.estado": "Estado",
  "pop.intensidade": "Intensidad",
  "pop.potencia": "Potencia",
  "pop.pot_origem": "Potencia: origen del valor",
  "pop.lampada": "Tipo de lámpara",
  "pop.regiao": "Región",
  "pop.circuito": "Circuito (simulado)",
  "pop.origem": "Origen de la posición",
  "pop.sens_leitura": "Última lectura",
  "pop.sens_hora": "Hora de la lectura",
  "pop.sens_origem": "Origen: {o} (no es un sensor real)",
  "pop.linhas": "Líneas",
  "pop.porta_perto": "Puerta más cercana",
  "pop.porta_dist": "{m} m en línea recta · unos {min} min a pie",
  "pop.estimativa": "(estimación; no es una ruta)",
  "pop.bici_ler": "Leyendo la disponibilidad…",
  "pop.bici_off": "Disponibilidad en tiempo real desactivada (?bicimad=off).",
  "pop.bici_agora": "Ahora: <b>{b} bicicletas</b> · {d} anclajes libres",
  "pop.bici_estado": " · estado {s}",
  "pop.bici_lido": "GBFS de BiciMAD, leído a las {h}",
  "pop.bici_sem": "Sin datos en tiempo real para esta estación.",
  "pop.bici_erro": "Disponibilidad en tiempo real: sin conexión.",
  "pop.porta_intro": "Para entrar por esta puerta (distancias en línea recta, estimación):",
  "pop.p_metro": "Metro",
  "pop.p_cercanias": "Cercanías",
  "pop.p_bus": "Autobuses EMT",
  "pop.p_paragem": "Parada más cercana",
  "pop.p_bici": "BiciMAD",
  "pop.p_taxi": "Taxi",
  "pop.p_estac": "Aparcamiento",
  "pop.tunel": "Trazado en túnel (posición en planta).",
  "pop.osm": "Fuente: OpenStreetMap.",
  "pop.itinerario": "Trazado del itinerario dentro del área (los dos sentidos).",
  "pop.ciclovia": "Carril bici: {l}",
  "pop.linha": "{modo} · línea {l}",

  // painel do gestor (web/painel.*)
  "pai.h1": "Panel del gestor",
  "pai.sub": "Parque del Retiro · alumbrado y sensores · <strong>datos simulados</strong>",
  "pai.ligar_a": "Conectando…",
  "pai.abrir_gemeo": "Abrir el gemelo",
  "pai.resumo": "Resumen",
  "pai.sensores": "Sensores por región",
  "pai.postes": "Alumbrado por región",
  "pai.mostrar": "Mostrar",
  "pai.f_todos": "Todas las farolas",
  "pai.f_ligado": "Solo encendidas",
  "pai.f_desligado": "Solo apagadas",
  "pai.f_avariado": "Solo averiadas",
  "pai.ligar_parque": "Encender el parque",
  "pai.desligar_parque": "Apagar el parque",
  "pai.nota": "Abrir una región muestra sus circuitos y farolas.",
  "pai.rodape": "Posiciones: inventario de unidades luminosas del Ayuntamiento de Madrid (CC BY 4.0) y OpenStreetMap (ODbL). Estado, intensidad, regiones, circuitos, potencia de los LED y sensores son simulados para esta prueba.",
  "pai.recusadas": "{n} edición(es) rechazada(s)",
  "pai.sem_gravar": "Sin conexión: la edición no se guardó",
  "pai.contagem": "{a} de {n} encendidas",
  "pai.avariados1": " · {n} averiada",
  "pai.avariadosN": " · {n} averiadas",
  "pai.lig_desl": "Encender o apagar {id}",
  "pai.int_de": "Intensidad de {id}",
  "pai.avaria": "Avería",
  "pai.vazio": "Ninguna farola con este filtro.",
  "pai.ligar": "Encender",
  "pai.desligar": "Apagar",
  "pai.circuito": "Circuito {c}",
  "pai.circuito_min": "circuito {c}",
  "pai.ligados": "Encendidas",
  "pai.desligados": "Apagadas",
  "pai.avariados": "Averiadas",
  "pai.pot_ligada": "Potencia encendida (estimada)",
  "pai.media": "{t}: media de {n} sensor(es)",
  "pai.n_sens": "{n} sensores en {r} regiones · medias por región · simulados",
  "pai.ligado": "Conectado · {p} farolas · {s} sensores",
  "pai.sem": "Sin conexión con el servidor de activos",
  "pai.off": "Activos desactivados (?ativos=off)",
  "atv.demo": "Demostración: los cambios solo se ven en este navegador",
  "pai.ligado_demo": "Demostración · {p} farolas · {s} sensores",
  "pai.demo_repor": "Reponer",
  "cred.abrir": "Créditos",
  "amp.abrir": "Ampliar",
  "amp.abrir_t": "Ampliar vista: solo el modelo 3D, sin menús",
  "amp.sair": "Salir de la vista ampliada",
  // plano 2D (web/plano2d.js) e escolha 2D / 3D
  "pl.aria": "Plano del Retiro",
  "pl.plano": "Plano 01",
  "pl.leg": "Plano dibujado a partir de datos reales: caminos, agua, setos, edificios, {n} árboles y las puertas.",
  "pl.puertas": "Puertas", "pl.zonas": "Zonas 3D", "pl.arte": "Arte público",
  "pl.puerta": "Puerta", "pl.monumental": "Puerta monumental", "pl.sin_nome": "Puerta sin nombre",
  "pl.metro": "Metro", "pl.bus": "Autobús", "pl.autor": "Autor", "pl.ano": "Año",
  "pl.cerrar": "Cerrar", "pl.mas": "Acercar", "pl.menos": "Alejar", "pl.inicio": "Todo el parque",
  "pl.toca": "Toca una puerta para ver cómo llegar.",
  "pl.zona_3d": "Zona modelada en 3D", "pl.ver3d": "Ver en 3D ›", "pl.llegar": "Cómo llegar ›",
  "pl.fuente": "Datos: © OpenStreetMap (ODbL) · Ayto. de Madrid · CRTM",
  "pl.k.Escultura": "Escultura", "pl.k.Fuente": "Fuente", "pl.k.Monolito": "Monolito",
  "pl.zona.piloto": "Estanque Grande", "pl.zona.cristal": "Palacio de Cristal", "pl.zona.velazquez": "Palacio de Velázquez",
  "pl.zona.rosaleda": "La Rosaleda", "pl.zona.parterre": "Parterre", "pl.zona.estatuas": "Paseo de las Estatuas",
  "pl.zona.vacas": "Casa de Vacas", "pl.zona.cecilio": "Jardines de Cecilio Rodríguez",
  "motor.grupo": "Tipo de mapa", "motor.2d": "Plano", "motor.3d": "3D",
  "est.plano": "Plano 2D · el modelo 3D se carga al elegir 3D",
  "vis.pa_3d": "Los paseos recorren el modelo 3D a la altura de los ojos.",
  "vis.pa_abrir3d": "Abrir en 3D ›",
  "cred.titulo": "Créditos y fuentes",
  "cred.fechar": "Cerrar",
  "cred.corpo": `<p>Gemelo digital del Parque del Retiro hecho con datos abiertos. Cada fuente conserva su licencia.</p>
<dl>
<dt>Ayuntamiento de Madrid · <a href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noopener">CC BY 4.0</a></dt>
<dd>Geoportal (<a href="https://geoportal.madrid.es" target="_blank" rel="noopener">geoportal.madrid.es</a>): modelo digital del terreno 2025, modelo de superficies 2023 y ortofotos; modelo 3D LOD2 de edificios. <a href="https://datos.madrid.es" target="_blank" rel="noopener">datos.madrid.es</a>: arbolado en parques, arte público y unidades luminosas (farolas) en parques históricos.</dd>
<dt>Instituto Geográfico Nacional (CNIG) · <a href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noopener">CC BY 4.0</a></dt>
<dd>Modelo digital del terreno de 5 m para el entorno del parque. © Instituto Geográfico Nacional.</dd>
<dt>© OpenStreetMap contributors · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">ODbL</a></dt>
<dd>Caminos, agua, setos, parterres, bancos, límite y puertas del parque; paradas de taxi, aparcamientos y vías ciclistas.</dd>
<dt>Consorcio Regional de Transportes de Madrid · <a href="https://www.crtm.es/licencia-de-uso" target="_blank" rel="noopener">licencia de uso del CRTM</a></dt>
<dd>Metro, Cercanías, autobuses EMT e interurbanos (datos de 29/05/2026). <a href="https://www.crtm.es" target="_blank" rel="noopener">Powered by CRTM</a>.</dd>
<dt>BiciMAD · EMT de Madrid</dt>
<dd>Disponibilidad en tiempo real (GBFS), leída solo al abrir una estación, según las <a href="https://mobilitylabs.emtmadrid.es/sip/terms-of-use" target="_blank" rel="noopener">condiciones de uso de la EMT</a>. <a href="https://www.emtmadrid.es" target="_blank" rel="noopener">Powered by EMT de Madrid</a>.</dd>
<dt>Software</dt>
<dd>ArcGIS Maps SDK for JavaScript 5.0 (Esri). Modelo montado en Blender y ArcGIS Pro. Tipografía Hanken Grotesk (SIL Open Font License).</dd>
</dl>
<h3>Qué es aproximado</h3>
<ul>
<li><b>Generado por IA:</b> el grupo de bronce del Ángel Caído es un modelo 3D generado por IA (Higgsfield) a partir de fotografías; la espalda y los lados son inventados, no es un levantamiento. También lo son las láminas de fauna y la textura de la piedra.</li>
<li><b>Activos simulados:</b> las posiciones de las farolas vienen del inventario municipal y de OpenStreetMap; su estado, intensidad, regiones, circuitos y potencia (en su mayoría estimada) son simulados, y los 36 sensores y sus lecturas son inventados. En esta demostración los cambios solo se ven en este navegador.</li>
<li><b>Monumentos:</b> modelados a mano con medidas del modelo de superficies y fotografías de referencia (Wikimedia Commons); proporciones aproximadas, sin ornamento fino.</li>
</ul>`,
};

const EN = {
  "doc.titulo": "Retiro · Digital twin",
  "doc.painel": "Retiro · Manager panel",
  "idioma.rot": "Language",
  "marca.sub": "Digital twin",
  "app.visita": "Visit",
  "app.gestion": "Management",
  "app.volver": "Back to the start",

  "ent.topo": "Digital twin · Madrid",
  "ent.lamina": "Plate 01 · Ahuehuete of the Parterre",
  "ent.lamina_alt": "Ahuehuete, engraving",
  "ent.h1": "The Retiro, <em>piece by piece.</em>",
  "ent.p": "A 3D model of the park built from real data: terrain, trees, monuments, the railings and gates, and the street lighting. The sensors are simulated for now.",
  "ent.visita_d": "Arrive by metro, walk at eye level, see each area at any time of day.",
  "ent.gestion_d": "Lighting, sensors and transport, sorted by what needs attention.",
  "ent.entrar": "Enter ›",
  "ent.reservado": "Restricted access",
  "ent.fauna": "Who lives in the Retiro",
  "ent.pato_d": "On the Estanque, all year round.",
  "ent.pavo_d": "Jardines de Cecilio Rodríguez.",
  "ent.cotorra_d": "High in the treetops, in flocks.",
  "ent.n_zonas": "Modelled areas",
  "ent.n_luces": "Street lights",
  "ent.n_puertas": "Gates",
  "ent.n_paseos": "Walks",
  "ent.rod": "Simulated sensors and estimated power; the Fallen Angel bronze is an AI-generated model.",
  "ent.heroi_alt": "Cut-paper illustration of the Retiro's Estanque, with the Alfonso XII monument and the Palacio de Cristal",
  "ent.heroi_leg": "The Estanque, the Alfonso XII monument and the Palacio de Cristal in cut paper. Free composition, not to scale.",
  "ent.vista01": "View 01",
  "ent.v_visita": "{portas} gates · {paseos} walks · {zonas} areas",
  "ent.v_gestion": "{av} faults · {avisos} warnings · {lig}/{n} lights",
  "ent.v_gestion1": "{av} fault · {avisos} warnings · {lig}/{n} lights",
  "ent.v_gestion_est": "{n} street lights · {s} simulated sensors",

  "hora.ver": "See at",
  "hora.rot": "Time",
  "hora.agora": "Now",
  "hora.aria": "Time {h}",
  "hora.cursor": "Time of day",

  "vista.grupo": "Views",
  "vista.parque": "Park",
  "vista.estanque": "Estanque",
  "vista.monumento": "Monument",
  "vista.passeio": "Estanque, on foot",
  "vista.cristal": "Cristal",
  "vista.velazquez": "Velázquez",
  "vista.rosaleda": "Rosaleda",
  "vista.parterre": "Parterre",
  "vista.estatuas": "Estatuas",
  "vista.vacas": "Casa de Vacas",
  "vista.cecilio": "Cecilio Rodríguez",
  "vista.independencia": "P. Independencia",
  "vista.angel": "Ángel Caído",
  "vista.mobilidade": "Transport",

  "vis.tabs": "Visit sections",
  "vis.chegar": "Getting here",
  "vis.passeios": "Walks",
  "vis.zonas": "Areas",
  "vis.natureza": "Nature",
  "vis.ch_tit": "Gates · nearest metro",
  "vis.ch_tit2": "on foot, straight line",
  "vis.th_porta": "Gate",
  "vis.th_metro": "Metro",
  "vis.th_pe": "On foot",
  "vis.th_bus": "Bus",
  "vis.min": "{n} min",
  "vis.ch_rod": "Gates and stations from OpenStreetMap and CRTM; distances measured on the model, in a straight line. No real timetables or waiting times. Tap a gate to fly the camera there.",
  "vis.ch_cargando": "Loading the gates…",
  "vis.transporte": "Transport on the map",
  "vis.transporte_s": "Metro, Cercanías, bus, BiciMAD and more around the gates",
  "vis.pa_tit": "Walks at eye level",
  "vis.pa_tit2": "1.3 m/s",
  "vis.th_percurso": "Route",
  "vis.th_km": "km",
  "vis.th_min": "Min",
  "vis.partir": "Start ›",
  "vis.livre": "Walk freely",
  "vis.livre_s": "W A S D or arrow keys; buttons on a phone",
  "vis.pa_rod": "The walk follows the model at eye level; the panel folds away and only the route stays. Drag on the map to look around; Esc leaves.",
  "vis.pa_cargando": "Loading the routes…",
  "vis.pa_falta": "Walk mode did not load.",
  "vis.zo_tit": "Modelled areas",
  "vis.zo_tit2": "{n} views",
  "vis.ver": "View ›",
  "vis.zo_rod": "Each row flies the camera to its view. The same views are on the buttons over the map.",
  "vis.na_tit": "In the Retiro, in November",
  "vis.na_tit2": "trees and birds",
  "vis.na_rod": "Species often seen in the park; places are approximate and do not come from the municipal inventory. AI-generated illustrations, not photographs.",
  "zona.estanque_s": "Monumento a Alfonso XII",
  "zona.rosaleda_s": "and the Ángel Caído",
  "zona.vacas_s": "and the Quiosco de Música",
  "zona.passeio_s": "On foot, by the water",
  "zona.mobilidade_s": "The park and its surroundings, with transport",

  "nat.ahuehuete": "Montezuma cypress (ahuehuete)", "nat.ahuehuete_o": "Parterre", "nat.ahuehuete_n": "Said to be the oldest tree in Madrid",
  "nat.pato": "Mallard", "nat.pato_o": "Estanque", "nat.pato_n": "On the water all year round",
  "nat.pavao": "Peacock", "nat.pavao_o": "Jardines de Cecilio Rodríguez", "nat.pavao_n": "Wanders among hedges and pergolas",
  "nat.periquito": "Monk parakeet", "nat.periquito_o": "High treetops, all over the park", "nat.periquito_n": "Non-native; builds large shared nests",
  "nat.platano": "London plane", "nat.platano_o": "Paseos and avenues", "nat.platano_n": "In November, yellow leaves on the ground",
  "nat.castanheiro": "Horse chestnut", "nat.castanheiro_o": "Several spots in the park", "nat.castanheiro_n": "Spiky husks and conkers in autumn",

  "pas.painel": "Walk mode",
  "pas.titulo": "Walk",
  "pas.sair": "Leave",
  "pas.percurso": "Route",
  "pas.opcao": "{nome} · {km} km",
  "pas.livre": "Walk freely (keys / buttons)",
  "pas.pausa": "Pause",
  "pas.continuar": "Resume",
  "pas.recomecar": "Restart",
  "pas.velocidade": "Speed",
  "pas.posicao": "Position on the route",
  "pas.esq": "Turn left",
  "pas.frente": "Walk forward",
  "pas.dir": "Turn right",
  "pas.ladoE": "Step left",
  "pas.tras": "Walk backward",
  "pas.ladoD": "Step right",
  "pas.chegou": "Arrived. Pick another route or leave.",
  "pas.progresso": "{s} of {L} m · {min} min to go",
  "pas.livre_info": "Free · {x}, {y}",

  "ges.tabs": "Management sections",
  "ges.operacao": "Operations",
  "ges.control": "Control",
  "ges.camadas": "Layers",
  "ges.p_luzes": "Lights on",
  "ges.p_pot": "Power",
  "ges.p_avarias": "Faults",
  "ges.p_avisos": "Warnings",
  "ges.op_tit": "Regions · by what needs attention",
  "ges.op_tit2": "{n} regions",
  "ges.th_regiao": "Region",
  "ges.th_luzes": "Lights",
  "ges.th_solo": "Soil",
  "ges.th_estado": "Status",
  "ges.e_avaria": "{n} fault",
  "ges.e_avarias": "{n} faults",
  "ges.e_ruido": "High noise",
  "ges.e_seco": "Dry soil",
  "ges.e_ok": "Normal",
  "ges.op_rod": "Simulated sensors; power estimated from the lamp type. Thresholds set by this interface, not by the service: noise > 70 dB, soil < 18 %. Re-read every 4 s.",
  "ges.op_espera": "Waiting for the asset layers…",
  "ges.op_sem": "No connection to the asset server. Figures come back when it answers.",
  "ges.op_off": "Assets switched off (?ativos=off).",
  "ges.ch_regiao": "Region",
  "ges.ch_seco": "Soil at {v} %, below the threshold (18 %): check the irrigation.",
  "ges.ch_ruido": "Noise at {v} dB, above the threshold (70 dB).",
  "ges.ch_avaria": "{id} faulty · {circuito} · {tipo}",
  "ges.ch_ir": "Go to the area",
  "ges.ch_control": "Open in Control",
  "ges.ch_fechar": "Close",
  "ges.ca_tit": "On the map",
  "ges.ca_tit2": "one row per layer",
  "ges.th_camada": "Layer",
  "ges.c_ilum": "Lighting",
  "ges.c_ilum_s": "{n} street lights · grey = off, red = faulty",
  "ges.c_sens": "Sensors",
  "ges.c_sens_s": "{n} simulated sensors · temperature, noise, soil moisture",
  "ges.c_arv": "Trees",
  "ges.c_arv_s": "Municipal inventory · {n} trees",
  "ges.c_sombras": "Shadows",
  "ges.c_sombras_s": "Sun of 15 May; shadows from trees near the camera",
  "ges.c_arte": "Public art",
  "ges.c_arte_s": "{n} works with details",
  "ges.c_mob": "Transport",
  "ges.c_mob_s": "Metro, Cercanías, bus and BiciMAD near the gates",
  "ges.li_tit": "Warning thresholds",
  "ges.li_tit2": "set by this interface",
  "ges.li_ruido": "Noise",
  "ges.li_solo": "Soil moisture",
  "ges.li_apagada": "Faulty street light",
  "ges.li_avaria": "fault",
  "ges.ct_titulo": "Manager panel",
  "ges.ct_aparte": "Open separately",
  "ges.ct_nota": "The panel writes to the layers; the map re-reads them every second while this tab is open.",
  "mob.grupo": "Transport modes",
  "mob.autocarro": "Bus",
  "mob.metro": "Metro",
  "mob.cercanias": "Cercanías",
  "mob.bicimad": "BiciMAD",
  "mob.outros": "Other",
  "mob.outros_t": "Taxis, car parks, bike parking, cycle lanes and intercity buses",
  "rod.dados": "Data: Ayuntamiento de Madrid (CC BY 4.0) · IGN (CC BY 4.0) · © OpenStreetMap contributors (ODbL) · BiciMAD (EMT Madrid)",

  "est.carregar": "Loading the model…",
  "est.pronto": "{arv} trees · {arte} works of art",
  "est.falhou": "Did not load: {lista}",
  "atv.desligados": "Assets switched off",
  "atv.estado": "{n} street lights ({a} on) · {s} simulated sensors",
  "atv.sem_ligacao": "Assets: no connection (last known state)",
  "atv.servidor_off": "Assets: server off",
  "atv.falhou": "Assets: did not load",
  "mob.carregar": "Loading transport…",
  "mob.estado": "{bus} EMT stops · {metro} metro stations · {cerc} Cercanías · {bici} BiciMAD · {portas} gates",
  "mob.falhou_dados": "Transport: the data did not load",
  "mob.falhou": "Transport: did not load",

  "pop.agua": "Water",
  "pop.agua_cota": "Water surface level: {cota} m",
  "pop.arv_altura": "Height (m)",
  "pop.arv_perimetro": "Trunk girth (cm)",
  "pop.arv_inv": "Inventory no.",
  "pop.lum": "Street light {id}",
  "pop.estado": "Status",
  "pop.intensidade": "Intensity",
  "pop.potencia": "Power",
  "pop.pot_origem": "Power: source of the value",
  "pop.lampada": "Lamp type",
  "pop.regiao": "Region",
  "pop.circuito": "Circuit (simulated)",
  "pop.origem": "Position source",
  "pop.sens_leitura": "Latest reading",
  "pop.sens_hora": "Reading time",
  "pop.sens_origem": "Source: {o} (not a real sensor)",
  "pop.linhas": "Lines",
  "pop.porta_perto": "Nearest gate",
  "pop.porta_dist": "{m} m in a straight line · about {min} min on foot",
  "pop.estimativa": "(estimate; not a route)",
  "pop.bici_ler": "Reading availability…",
  "pop.bici_off": "Real-time availability switched off (?bicimad=off).",
  "pop.bici_agora": "Now: <b>{b} bikes</b> · {d} free docks",
  "pop.bici_estado": " · status {s}",
  "pop.bici_lido": "BiciMAD GBFS, read at {h}",
  "pop.bici_sem": "No real-time data for this station.",
  "pop.bici_erro": "Real-time availability: no connection.",
  "pop.porta_intro": "To enter through this gate (straight-line distances, estimate):",
  "pop.p_metro": "Metro",
  "pop.p_cercanias": "Cercanías",
  "pop.p_bus": "EMT buses",
  "pop.p_paragem": "Nearest stop",
  "pop.p_bici": "BiciMAD",
  "pop.p_taxi": "Taxi",
  "pop.p_estac": "Car park",
  "pop.tunel": "Line runs in a tunnel (plan position).",
  "pop.osm": "Source: OpenStreetMap.",
  "pop.itinerario": "Route of the line within the area (both directions).",
  "pop.ciclovia": "Cycle lane: {l}",
  "pop.linha": "{modo} · line {l}",

  "pai.h1": "Manager panel",
  "pai.sub": "Parque del Retiro · lighting and sensors · <strong>simulated data</strong>",
  "pai.ligar_a": "Connecting…",
  "pai.abrir_gemeo": "Open the twin",
  "pai.resumo": "Summary",
  "pai.sensores": "Sensors by region",
  "pai.postes": "Lighting by region",
  "pai.mostrar": "Show",
  "pai.f_todos": "All street lights",
  "pai.f_ligado": "On only",
  "pai.f_desligado": "Off only",
  "pai.f_avariado": "Faulty only",
  "pai.ligar_parque": "Switch the park on",
  "pai.desligar_parque": "Switch the park off",
  "pai.nota": "Opening a region shows its circuits and street lights.",
  "pai.rodape": "Positions: street-light inventory of the Ayuntamiento de Madrid (CC BY 4.0) and OpenStreetMap (ODbL). Status, intensity, regions, circuits, LED power and sensors are simulated for this test.",
  "pai.recusadas": "{n} edit(s) rejected",
  "pai.sem_gravar": "No connection: the edit was not saved",
  "pai.contagem": "{a} of {n} on",
  "pai.avariados1": " · {n} faulty",
  "pai.avariadosN": " · {n} faulty",
  "pai.lig_desl": "Switch {id} on or off",
  "pai.int_de": "Intensity of {id}",
  "pai.avaria": "Fault",
  "pai.vazio": "No street lights match this filter.",
  "pai.ligar": "On",
  "pai.desligar": "Off",
  "pai.circuito": "Circuit {c}",
  "pai.circuito_min": "circuit {c}",
  "pai.ligados": "On",
  "pai.desligados": "Off",
  "pai.avariados": "Faulty",
  "pai.pot_ligada": "Power in use (estimated)",
  "pai.media": "{t}: average of {n} sensor(s)",
  "pai.n_sens": "{n} sensors in {r} regions · averages by region · simulated",
  "pai.ligado": "Connected · {p} street lights · {s} sensors",
  "pai.sem": "No connection to the asset server",
  "pai.off": "Assets switched off (?ativos=off)",
  "atv.demo": "Demo: changes stay in this browser",
  "pai.ligado_demo": "Demo · {p} street lights · {s} sensors",
  "pai.demo_repor": "Reset",
  "cred.abrir": "Credits",
  "amp.abrir": "Expand",
  "amp.abrir_t": "Full view: only the 3D model, no menus",
  "amp.sair": "Exit full view",
  "pl.aria": "Plan of the Retiro",
  "pl.plano": "Plan 01",
  "pl.leg": "A plan drawn from real data: paths, water, hedges, buildings, {n} trees and the gates.",
  "pl.puertas": "Gates", "pl.zonas": "3D areas", "pl.arte": "Public art",
  "pl.puerta": "Gate", "pl.monumental": "Monumental gate", "pl.sin_nome": "Unnamed gate",
  "pl.metro": "Metro", "pl.bus": "Bus", "pl.autor": "Artist", "pl.ano": "Year",
  "pl.cerrar": "Close", "pl.mas": "Zoom in", "pl.menos": "Zoom out", "pl.inicio": "Whole park",
  "pl.toca": "Tap a gate to see how to get there.",
  "pl.zona_3d": "Area modelled in 3D", "pl.ver3d": "See in 3D ›", "pl.llegar": "How to get there ›",
  "pl.fuente": "Data: © OpenStreetMap (ODbL) · Madrid City Council · CRTM",
  "pl.k.Escultura": "Sculpture", "pl.k.Fuente": "Fountain", "pl.k.Monolito": "Monolith",
  "pl.zona.piloto": "Estanque Grande", "pl.zona.cristal": "Palacio de Cristal", "pl.zona.velazquez": "Palacio de Velázquez",
  "pl.zona.rosaleda": "La Rosaleda", "pl.zona.parterre": "Parterre", "pl.zona.estatuas": "Paseo de las Estatuas",
  "pl.zona.vacas": "Casa de Vacas", "pl.zona.cecilio": "Jardines de Cecilio Rodríguez",
  "motor.grupo": "Map type", "motor.2d": "Plan", "motor.3d": "3D",
  "est.plano": "2D plan · the 3D model loads when you choose 3D",
  "vis.pa_3d": "Walks go through the 3D model at eye level.",
  "vis.pa_abrir3d": "Open in 3D ›",
  "cred.titulo": "Credits and sources",
  "cred.fechar": "Close",
  "cred.corpo": `<p>Digital twin of the Retiro Park built from open data. Each source keeps its own licence.</p>
<dl>
<dt>Ayuntamiento de Madrid · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></dt>
<dd>Geoportal (<a href="https://geoportal.madrid.es" target="_blank" rel="noopener">geoportal.madrid.es</a>): 2025 terrain model, 2023 surface model and orthophotos; LOD2 3D building model. <a href="https://datos.madrid.es" target="_blank" rel="noopener">datos.madrid.es</a>: park trees, public art and street lights in historic parks.</dd>
<dt>Instituto Geográfico Nacional (CNIG) · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></dt>
<dd>5 m terrain model for the surroundings of the park. © Instituto Geográfico Nacional.</dd>
<dt>© OpenStreetMap contributors · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">ODbL</a></dt>
<dd>Paths, water, hedges, flower beds, benches, park boundary and gates; taxi ranks, car parks and cycle lanes.</dd>
<dt>Consorcio Regional de Transportes de Madrid · <a href="https://www.crtm.es/licencia-de-uso" target="_blank" rel="noopener">CRTM licence</a></dt>
<dd>Metro, Cercanías, EMT and interurban buses (data of 29/05/2026). <a href="https://www.crtm.es" target="_blank" rel="noopener">Powered by CRTM</a>.</dd>
<dt>BiciMAD · EMT de Madrid</dt>
<dd>Live availability (GBFS), read only when a station is opened, under the <a href="https://mobilitylabs.emtmadrid.es/sip/terms-of-use" target="_blank" rel="noopener">EMT terms of use</a>. <a href="https://www.emtmadrid.es" target="_blank" rel="noopener">Powered by EMT de Madrid</a>.</dd>
<dt>Software</dt>
<dd>ArcGIS Maps SDK for JavaScript 5.0 (Esri). Model assembled in Blender and ArcGIS Pro. Hanken Grotesk typeface (SIL Open Font License).</dd>
</dl>
<h3>What is approximate</h3>
<ul>
<li><b>AI-generated:</b> the bronze group of the Fallen Angel is a 3D model generated by AI (Higgsfield) from photographs; its back and sides are invented, it is not a survey. So are the wildlife plates and the stone texture.</li>
<li><b>Simulated assets:</b> street-light positions come from the city inventory and OpenStreetMap; their status, intensity, regions, circuits and power (mostly estimated) are simulated, and the 36 sensors and their readings are made up. In this demo, changes stay in this browser.</li>
<li><b>Monuments:</b> modelled by hand from surface-model measurements and reference photos (Wikimedia Commons); approximate proportions, no fine ornament.</li>
</ul>`,
};

// ---- valores dos dados (o que vem das camadas e dos ficheiros de data/ está em português)
const DADOS = {
  es: {
    estado: { ligado: "encendida", desligado: "apagada", avariado: "averiada" },
    sensor: { temperatura: "Temperatura", ruido: "Ruido", humidade_solo: "Humedad del suelo" },
    origem: { inventario: "inventario municipal", osm: "OpenStreetMap", simulado: "simulado", estimada: "estimada" },
    mobModo: { autocarro: "Autobús EMT", interurbano: "Autobús interurbano", metro: "Metro", cercanias: "Cercanías", bicimad: "BiciMAD",
      taxi: "Taxi", estacionamento: "Aparcamiento", aparcabicis: "Bicicletas", ciclovia: "Carril bici" },
    percurso: { volta_estanque: "Vuelta al Estanque" },
    // substituições de texto, por ordem
    frases: [[/Porta sem nome \(junto à (.*?)\)/, "Puerta sin nombre (junto a la $1)"], [/Porta sem nome \(lado sul\)/, "Puerta sin nombre (lado sur)"],
      ["Resto do parque", "Resto del parque"], [/\bnascente\b/g, "este"], [/\bpoente\b/g, "oeste"], [/\bsul\b/g, "sur"],
      [/(\d+) paragens a menos de (\d+) m/, "$1 paradas a menos de $2 m"], [/paragem n\.º/, "parada n.º"], [/\bparagem\b/, "parada"],
      [/praça de táxis/i, "Parada de taxis"], [/parque de estacionamento/, "aparcamiento"], [/aparcamento de bicicletas/, "aparcabicis"],
      [/^Estacionamento/, "Aparcamiento"], [/\bestação\b/, "estación"], [/\bacessos\b/, "accesos"], [/\bacesso\b/, "acceso"],
      [/sem acessibilidade/, "sin accesibilidad"], [/\bacessível\b/, "accesible"], [/\blugares\b/, "plazas"], [/subterrâneo/, "subterráneo"],
      [/em altura/, "en altura"], [/\bpago\b/, "de pago"], [/ancoragens/, "anclajes"], [/Porta sem nome \(junto à (.*?)\)/, "Puerta sin nombre (junto a la $1)"],
      [/Porta sem nome \(lado sul\)/, "Puerta sin nombre (lado sur)"], [/desconhecido/, "desconocido"]],
  },
  en: {
    estado: { ligado: "on", desligado: "off", avariado: "faulty" },
    sensor: { temperatura: "Temperature", ruido: "Noise", humidade_solo: "Soil moisture" },
    origem: { inventario: "municipal inventory", osm: "OpenStreetMap", simulado: "simulated", estimada: "estimated" },
    mobModo: { autocarro: "EMT bus", interurbano: "Intercity bus", metro: "Metro", cercanias: "Cercanías", bicimad: "BiciMAD",
      taxi: "Taxi", estacionamento: "Car park", aparcabicis: "Bicycles", ciclovia: "Cycle lane" },
    percurso: { volta_estanque: "Around the Estanque" },
    frases: [[/Porta sem nome \(junto à (.*?)\)/, "Unnamed gate (next to the $1)"], [/Porta sem nome \(lado sul\)/, "Unnamed gate (south side)"],
      ["Resto do parque", "Rest of the park"], [/\bnascente\b/g, "east"], [/\bpoente\b/g, "west"], [/\bsul\b/g, "south"], [/\bnorte\b/g, "north"],
      [/(\d+) paragens a menos de (\d+) m/, "$1 stops within $2 m"], [/paragem n\.º/, "stop no."], [/\bparagem\b/, "stop"],
      [/praça de táxis/i, "Taxi rank"], [/parque de estacionamento/, "car park"], [/aparcamento de bicicletas/, "bike parking"],
      [/^Estacionamento/, "Car park"], [/\bestação\b/, "station"], [/\bacessos\b/, "entrances"], [/\bacesso\b/, "entrance"],
      [/sem acessibilidade/, "no step-free access"], [/\bacessível\b/, "step-free"], [/\blugares\b/, "spaces"], [/subterrâneo/, "underground"],
      [/em altura/, "multi-storey"], [/\bpago\b/, "paid"], [/ancoragens/, "docks"], [/Porta sem nome \(junto à (.*?)\)/, "Unnamed gate (next to the $1)"],
      [/Porta sem nome \(lado sul\)/, "Unnamed gate (south side)"], [/desconhecido/, "unknown"], [/frente al Nº/g, "opposite no."]],
  },
};

const DIC = { es: ES, en: EN };
export const IDIOMAS = [["es", "ES", "Español"], ["en", "EN", "English"]];
const LOCALE = { es: "es-ES", en: "en-GB" };

function inicial() {
  const q = new URLSearchParams(location.search).get("lang");
  if (DIC[q]) { try { localStorage.setItem("retiro-lang", q); } catch { /* sem armazenamento */ } return q; }
  try { const s = localStorage.getItem("retiro-lang"); if (DIC[s]) return s; } catch { /* sem armazenamento */ }
  return "es";
}
export let lang = inicial();
export const locale = () => LOCALE[lang];
document.documentElement.lang = lang;

export const fmt = {
  num: (v, casas = 0) => Number(v).toLocaleString(LOCALE[lang], { minimumFractionDigits: casas, maximumFractionDigits: casas }),
  kW: (w) => fmt.num(w / 1000, 1),
  hora: (h) => {
    const hh = Math.floor(h) % 24, mm = Math.round((h - Math.floor(h)) * 60);
    return `${String(mm === 60 ? hh + 1 : hh).padStart(2, "0")}:${String(mm === 60 ? 0 : mm).padStart(2, "0")}`;
  },
  relogio: (ms) => new Date(ms).toLocaleTimeString(LOCALE[lang]),
};

// t("chave", {n: 3}) -> texto; números são formatados no idioma atual
export function t(chave, vars) {
  let s = DIC[lang][chave] ?? ES[chave] ?? chave;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? (typeof vars[k] === "number" ? fmt.num(vars[k]) : String(vars[k])) : m));
  return s;
}

// dado("estado", "ligado") -> "encendida"; dado("texto", "Resto do parque · sul") -> "Resto del parque · sur"
export function dado(tipo, valor) {
  if (valor == null || valor === "") return valor ?? "";
  const d = DADOS[lang];
  if (tipo === "percurso") return d.percurso[valor.id] ?? valor.nome;
  const mapa = d[tipo];
  if (mapa && mapa[valor] != null) return mapa[valor];
  let s = String(valor);
  for (const [de, para] of d.frases) s = s.replace(de, para);
  return s;
}

// retraduz os elementos marcados: data-i18n (texto), data-i18n-html (com marcação), data-i18n-attr ("attr:chave;attr:chave")
export function aplicar(raiz = document) {
  const vars = (el) => { try { return el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : undefined; } catch { return undefined; } };
  raiz.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n, vars(el)); });
  raiz.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml, vars(el)); });
  raiz.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    for (const par of el.dataset.i18nAttr.split(";")) { const [a, k] = par.split(":"); if (a && k) el.setAttribute(a, t(k, vars(el))); }
  });
}

// texto de estado que se retraduz sozinho ao mudar de idioma
export function poeTexto(el, chave, vars) {
  if (!el) return;
  el.dataset.i18n = chave;
  if (vars) el.dataset.i18nVars = JSON.stringify(vars); else delete el.dataset.i18nVars;
  el.textContent = t(chave, vars);
}

export function definirIdioma(l) {
  if (!DIC[l] || l === lang) return;
  lang = l;
  document.documentElement.lang = l;
  try { localStorage.setItem("retiro-lang", l); } catch { /* sem armazenamento */ }
  const u = new URL(location.href);
  if (u.searchParams.has("lang")) { u.searchParams.set("lang", l); history.replaceState(history.state, "", u); }
  aplicar();
  dispatchEvent(new CustomEvent("retiro:idioma", { detail: l }));
}

// seletor ES / EN (botões de alternância)
export function seletorIdioma(el) {
  el.setAttribute("role", "group");
  el.dataset.i18nAttr = "aria-label:idioma.rot";
  el.innerHTML = IDIOMAS.map(([id, curto, nome]) => `<button type="button" data-lang="${id}" lang="${id}" title="${nome}" aria-pressed="${id === lang}">${curto}</button>`).join("");
  el.addEventListener("click", (e) => { const b = e.target.closest("button[data-lang]"); if (b) definirIdioma(b.dataset.lang); });
  addEventListener("retiro:idioma", () => el.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang))));
  aplicar(el.parentElement ?? document);
}
