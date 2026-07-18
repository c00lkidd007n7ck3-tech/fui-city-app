"use strict";

/* -------------------------------------------------------------------------- */
/*  CORE MAPLIBRE: CARTOGRAFÍA, CÁMARA Y ROTACIÓN TÁCTICA                     */
/* -------------------------------------------------------------------------- */

const map = new maplibregl.Map({
    container: "map",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    center: [-57.8872, -34.8732],
    zoom: 14.8,
    pitch: 60,
    bearing: -18,
    attributionControl: false
});

/* Espejos ordenados por prioridad para tolerar caídas o saturación del primario. */
const OVERPASS_ENDPOINTS = Object.freeze([
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
]);

const SECTORES_TACTICOS = Object.freeze({
    AR_BERISSO: {
        centro: [-57.8872, -34.8732],
        zoom: 14.8
    },
    UY_MONTEVIDEO: {
        centro: [-56.1645, -34.9011],
        zoom: 14.2
    },
    ES_MADRID: {
        centro: [-3.7038, 40.4167],
        zoom: 15
    }
});

/* -------------------------------------------------------------------------- */
/*  BASE LOCAL VERIFICADA: VERDULERÍAS Y FERIAS DE BERISSO                    */
/* -------------------------------------------------------------------------- */

const REAL_VEGGIE_NODES = Object.freeze([
    { nombre: "VERDULERÍA LA 11", coords: [-57.8631, -34.8720], direccion: "Calle 11 (Guayaquil) 3217", info: "Lun a Sáb 07:00 a 20:30. Envios a domicilio." },
    { nombre: "ALMACÉN EL DUQUE", coords: [-57.9150, -34.8430], direccion: "Calle 128 N° 1406", info: "Verdulería y Kiosco. Lun a Dom." },
    { nombre: "MAYORISTA ROTONDA 128 Y 60", coords: [-57.9135, -34.8420], direccion: "Calle 128 N° 1356", info: "Venta mayorista y minorista." },
    { nombre: "FERIA: PLAYÓN MUNICIPAL", coords: [-57.8860, -34.8722], direccion: "Av. Montevideo y Calle 11", info: "Mercado Bonaerense. Viernes 09:00 a 14:00. Cuenta DNI." },
    { nombre: "FERIA: PUENTE 3 DE ABRIL", coords: [-57.8805, -34.8640], direccion: "Carlos Gardel y Av. Montevideo", info: "Mercado Bonaerense. Jueves 09:00 a 14:00." },
    { nombre: "MERCADO DE LA RIBERA", coords: [-57.8842, -34.8795], direccion: "Calle 170 entre 8 y 9", info: "Domingos 10:00 a 18:00. Productos de la isla, vino y miel." },
    { nombre: "FERIA PARQUE CÍVICO", coords: [-57.8855, -34.8745], direccion: "Parque Cívico de Berisso", info: "Martes 12:00 a 16:00. Verduras agroecológicas." },
    { nombre: "COOPERATIVA LA JUSTA", coords: [-57.9170, -34.8390], direccion: "Calle 60 y Calle 130", info: "Bolsones agroecológicos de economía popular." },
    { nombre: "DESPENSAS BARRIALES NODO 49", coords: [-57.8995, -34.8510], direccion: "Calle 49 N° 3263 entre 160 y 161", info: "Mar, Vie y Jue. Alimentos de cooperativas." },
    { nombre: "FERIA HOGAR Y AMOR", coords: [-57.8925, -34.8960], direccion: "Calle 169 y Calle 32", info: "Miércoles de 10:00 en adelante. Agricultura familiar." },
    { nombre: "NODO ISLA PAULINO", coords: [-57.8420, -34.8350], direccion: "Isla Paulino", info: "Productores locales: cítricos, paltas e higos." },
    { nombre: "PUESTO MICHO", coords: [-57.8942, -34.8821], direccion: "Av. Montevideo y Calle 23", info: "Venta presencial tradicional." }
]);

const REAL_MEAT_NODES = Object.freeze([
    { nombre: "CARNICERÍA AZ", coords: [-57.8871, -34.8821], direccion: "Calle 23 esquina 165", info: "Cortes de carne vacuna, porcina y aviar. 10% Descuento Tienda Card." },
    { nombre: "CARNICERÍA MARECOS", coords: [-57.8931, -34.8690], direccion: "Calle Río de Janeiro e/ 157 y 158", info: "Atención personalizada. Precios accesibles para los vecinos." },
    { nombre: "CARNICERÍA DE LA CALLE 164", coords: [-57.8845, -34.8782], direccion: "Calle 164 entre 20 y 21", info: "Comercio local. Carnes frescas en horario comercial." },
    { nombre: "CARNES BERISSO", coords: [-57.8981, -34.8851], direccion: "Av. Montevideo esq. 27", info: "Carnes varias. Horario comercial extendido." },
    { nombre: "AUTOSERVICIO SUPER 32", coords: [-57.8988, -34.8601], direccion: "Calle 32 N° 552 / Esq. 132", info: "Supermercado completo. Carnicería (novillo, cerdo, pollo), fiambrería y almacén." },
    { nombre: "FRIGORÍFICO Y MATADERO TCB", coords: [-57.8761, -34.8582], direccion: "Calle Nueva York (Ex Swift)", info: "Planta de desposte. Carne envasada al vacío y hamburguesas de exportación." },
    { nombre: "DOÑA DORA MERCADO", coords: [-57.8975, -34.8842], direccion: "Av. Montevideo 2661", info: "Comercio de proximidad. Picadas, embutidos, chacinados y quesos." }
]);

const FERIAS_MIXTAS = Object.freeze([
    "MERCADO DE LA RIBERA",
    "FERIA PARQUE CÍVICO",
    "FERIA: PLAYÓN MUNICIPAL",
    "FERIA: PUENTE 3 DE ABRIL"
]);

let marcadoresActivos = [];
let radarActivo = false;
let cuadroAnimacion = null;
let temporizadorInactividad = null;
let tiempoAnterior = 0;
let solicitudActiva = null;
let radarBloqueadoPorNodos = false;

function toggleNodos() {
    const panel = document.getElementById("nodos-container");
    const boton = document.getElementById("radar-toggle-btn");
    panel.classList.toggle("hidden");
    if (panel.classList.contains("hidden")) {
        boton.innerText = "[ VER COMERCIOS ]";
    } else {
        boton.innerText = "[ OCULTAR ]";
    }
}

function toggleCategorias() {
    const contenedor = document.getElementById("categorias-secundarias");
    const boton = document.getElementById("expand-categories-btn");
    contenedor.classList.toggle("hidden");
    if (contenedor.classList.contains("hidden")) {
        boton.innerText = "[ OTRAS CATEGORÍAS ▼ ]";
    } else {
        boton.innerText = "[ VOLVER ▲ ]";
    }
}

/** Rota el bearing con una velocidad estable en cualquier tasa de refresco. */
function rotarRadar(tiempoActual) {
    if (!radarActivo) return;

    if (!tiempoAnterior) tiempoAnterior = tiempoActual;
    const delta = Math.min(tiempoActual - tiempoAnterior, 50);
    tiempoAnterior = tiempoActual;

    map.setBearing(map.getBearing() + delta * 0.0028);
    cuadroAnimacion = requestAnimationFrame(rotarRadar);
}

function iniciarRadar() {
    if (radarActivo || radarBloqueadoPorNodos) return;

    radarActivo = true;
    tiempoAnterior = 0;
    cuadroAnimacion = requestAnimationFrame(rotarRadar);
}

/** Pausa el radar y rearma la rotación después de cinco segundos. */
function registrarInteraccion() {
    radarActivo = false;
    tiempoAnterior = 0;
    cancelAnimationFrame(cuadroAnimacion);
    clearTimeout(temporizadorInactividad);
    temporizadorInactividad = setTimeout(iniciarRadar, 5000);
}

map.on("load", iniciarRadar);

/* originalEvent permite ignorar los movimientos creados por el propio radar. */
map.on("movestart", (evento) => {
    if (evento.originalEvent) registrarInteraccion();
});
map.on("touchstart", registrarInteraccion);

const canvas = map.getCanvas();
canvas.addEventListener("pointerdown", registrarInteraccion, { passive: true });
canvas.addEventListener("wheel", registrarInteraccion, { passive: true });

/* -------------------------------------------------------------------------- */
/*  CAMBIO GLOBAL DE SECTOR                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Desplaza la cámara a uno de los sectores registrados.
 * Devuelve false si el identificador recibido no existe.
 */
function cambiarSectorTactico(pais) {
    const sector = SECTORES_TACTICOS[pais];

    if (!sector) {
        console.warn(`[TACTICAL_RADAR] Sector desconocido: ${pais}`);
        return false;
    }

    registrarInteraccion();
    map.flyTo({
        center: sector.centro,
        zoom: sector.zoom,
        pitch: 60,
        bearing: 0,
        duration: 1800,
        essential: true
    });

    return true;
}

/* -------------------------------------------------------------------------- */
/*  UTILIDADES DE PRESENTACIÓN Y SEGURIDAD                                    */
/* -------------------------------------------------------------------------- */

function escaparHTML(valor) {
    return String(valor).replace(/[&<>'"]/g, (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;"
    })[caracter]);
}

function limpiarResultados() {
    marcadoresActivos.forEach((marcador) => marcador.remove());
    marcadoresActivos = [];
    radarBloqueadoPorNodos = false;

    if (map.loaded()) iniciarRadar();

    const lista = document.getElementById("lista-comercios");
    if (lista) lista.replaceChildren();
}

function informarEnHUD(mensaje) {
    const lista = document.getElementById("lista-comercios");
    if (!lista) return;

    const item = document.createElement("div");
    item.className = "fui-item-nodo";
    item.textContent = mensaje;
    lista.replaceChildren(item);
}

function actualizarEstadoHUD(cantidad, rubroFiltro) {
    const cabeceraNodos = document.querySelector(".sidebar-heading");
    if (cabeceraNodos) {
        cabeceraNodos.textContent = `[ NODOS_DETECTADOS // ${String(cantidad).padStart(3, "0")} ]`;
    }

    document.querySelectorAll(".fui-buttons button").forEach((boton) => {
        const accion = boton.getAttribute("onclick") || "";
        boton.classList.toggle("is-active", accion.includes(`'${rubroFiltro}'`));
    });
}

function crearNombreTactico(nombre, rubro) {
    const prefijos = {
        carniceria: "MEAT_NODE",
        verduleria: "GREEN_NODE",
        almacen: "SUPPLY_NODE",
        restaurante: "FOOD_NODE",
        kiosco: "KIOSK_NODE",
        ferreteria: "HARDWARE_NODE",
        jugueteria: "TOY_NODE"
    };

    return `${prefijos[rubro]}: ${nombre.toLocaleUpperCase("es")}`;
}

function normalizarNodoLocal(nodo, id, rubro) {
    return {
        id,
        nombreReal: nodo.nombre.toLocaleUpperCase("es"),
        nombreTactico: crearNombreTactico(nodo.nombre, rubro),
        coordenadas: nodo.coords,
        direccion: nodo.direccion.toLocaleUpperCase("es"),
        info: nodo.info,
        esLocal: true
    };
}

/** Compone la base prioritaria del rubro e incorpora las ferias mixtas. */
function obtenerNodosLocales(rubroFiltro) {
    if (rubroFiltro === "verduleria") {
        return REAL_VEGGIE_NODES.map((nodo, indice) =>
            normalizarNodoLocal(nodo, `VEG-${String(indice + 1).padStart(2, "0")}`, rubroFiltro)
        );
    }

    if (rubroFiltro === "carniceria") {
        const carnicerias = REAL_MEAT_NODES.map((nodo, indice) =>
            normalizarNodoLocal(nodo, `MEAT-${String(indice + 1).padStart(2, "0")}`, rubroFiltro)
        );
        const ferias = REAL_VEGGIE_NODES
            .filter((nodo) => FERIAS_MIXTAS.includes(nodo.nombre))
            .map((nodo, indice) =>
                normalizarNodoLocal(nodo, `MIX-${String(indice + 1).padStart(2, "0")}`, rubroFiltro)
            );

        return carnicerias.concat(ferias);
    }

    return [];
}

function obtenerDireccion(tags, longitud, latitud) {
    const calle = tags["addr:street"] || tags["addr:place"];
    const numero = tags["addr:housenumber"];

    if (calle && numero) return `${calle} ${numero}`;
    if (calle) return `${calle} // ALTURA NO REGISTRADA`;

    return `SECTOR APROX. ${latitud.toFixed(5)}, ${longitud.toFixed(5)}`;
}

function abrirNodoEnMapa(comercio, marcador, popup) {
    registrarInteraccion();
    map.flyTo({
        center: comercio.coordenadas,
        zoom: 16.5,
        pitch: 65,
        duration: 1400,
        essential: true
    });

    if (!popup.isOpen()) marcador.togglePopup();
}

function crearMarcadorYEntrada(comercio, lista) {
    /* Congela la cámara autónoma: los objetivos quedan visualmente inmóviles. */
    radarBloqueadoPorNodos = true;
    radarActivo = false;
    tiempoAnterior = 0;
    cancelAnimationFrame(cuadroAnimacion);

    const anillo = document.createElement("div");
    anillo.className = "tactical-marker";
    anillo.setAttribute("aria-label", `${comercio.nombreTactico}, ${comercio.direccion}`);

    /* Pulso exclusivamente luminoso: no desplaza ni transforma el nodo. */
    if (typeof anillo.animate === "function") {
        anillo.animate([
            { boxShadow: "0 0 7px #ff0033, 0 0 16px rgba(255, 0, 51, 0.65), inset 0 0 8px #ff0033" },
            { boxShadow: "0 0 11px #ffffff, 0 0 28px #ff0033, inset 0 0 12px #ff0033" }
        ], {
            duration: 1300,
            direction: "alternate",
            iterations: Infinity,
            easing: "ease-in-out"
        });
    }

    const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: true,
        maxWidth: "300px"
    }).setHTML(`
        <div class="tactical-popup">
            <div class="popup-id">${comercio.esLocal ? "LOCAL_ID" : "OSM_ID"} // ${escaparHTML(comercio.id)}</div>
            <div class="popup-name">${escaparHTML(comercio.nombreTactico)}</div>
            <div>LOCAL // ${escaparHTML(comercio.nombreReal)}</div>
            <div>LOC // ${escaparHTML(comercio.direccion)}</div>
            ${comercio.info ? `<div>HORARIOS / BENEFICIOS // ${escaparHTML(comercio.info.toLocaleUpperCase("es"))}</div>` : ""}
            <div>FUENTE // ${comercio.esLocal ? "BASE_LOCAL_BERISSO" : "OPENSTREETMAP"}</div>
        </div>
    `);

    const marcador = new maplibregl.Marker({
        element: anillo,
        anchor: "center",
        /* El objetivo queda proyectado sobre el terreno, no sobre la cámara. */
        rotationAlignment: "map",
        pitchAlignment: "map"
    })
        .setLngLat(comercio.coordenadas)
        .setPopup(popup)
        .addTo(map);

    marcadoresActivos.push(marcador);

    const itemNodo = document.createElement("div");
    itemNodo.className = "fui-item-nodo";
    itemNodo.tabIndex = 0;
    itemNodo.setAttribute("role", "button");
    itemNodo.textContent = `[${comercio.esLocal ? "LOCAL" : "OSM"}-${comercio.id}] ${comercio.nombreTactico}`;

    const seleccionar = () => abrirNodoEnMapa(comercio, marcador, popup);
    itemNodo.addEventListener("click", seleccionar);
    itemNodo.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            seleccionar();
        }
    });

    lista.appendChild(itemNodo);
}

/* -------------------------------------------------------------------------- */
/*  OVERPASS: CONSULTA DE COMERCIOS REALES EN EL ÁREA VISIBLE                 */
/* -------------------------------------------------------------------------- */

function obtenerValoresOSM(rubroFiltro) {
    const equivalencias = {
        carniceria: [{ clave: "shop", valor: "butcher" }],
        verduleria: [{ clave: "shop", valor: "greengrocer" }],
        almacen: [
            { clave: "shop", valor: "convenience" },
            { clave: "shop", valor: "supermarket" }
        ],
        restaurante: [{ clave: "amenity", valor: "restaurant" }],
        kiosco: [{ clave: "shop", valor: "kiosk" }],
        ferreteria: [{ clave: "shop", valor: "hardware" }],
        jugueteria: [{ clave: "shop", valor: "toys" }]
    };

    return equivalencias[rubroFiltro] || null;
}

function construirConsultaOverpass(filtrosOSM, bounds) {
    /* Overpass exige estrictamente el orden: sur, oeste, norte, este. */
    const sur = bounds.getSouth();
    const oeste = bounds.getWest();
    const norte = bounds.getNorth();
    const este = bounds.getEast();

    const selectores = filtrosOSM
        .map((filtro) =>
            'node["' + filtro.clave + '"="' + filtro.valor + '"](' +
            sur + ',' + oeste + ',' + norte + ',' + este + ');'
        )
        .join("");

    return `[out:json][timeout:12];(${selectores});out body;`;
}

/** Consulta un espejo y rechaza también las respuestas HTTP no exitosas. */
async function consultarEspejoOverpass(endpoint, query, signal) {
    /* POST evita límites de longitud y sigue siendo una solicitud CORS simple. */
    const respuesta = await fetch(endpoint, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        signal
    });

    if (!respuesta.ok) {
        throw new Error(`${endpoint} respondió HTTP ${respuesta.status}`);
    }

    return respuesta.json();
}

/**
 * Alternativa ES6 a Promise.any para navegadores Linux/WebKit antiguos.
 * Resuelve con la primera promesa exitosa y sólo rechaza si todas fallan.
 */
function primeraRespuestaValida(promesas) {
    return new Promise((resolve, reject) => {
        let fallos = 0;
        let ultimoError = new Error("No hay servidores Overpass configurados");

        if (!promesas.length) {
            reject(ultimoError);
            return;
        }

        promesas.forEach((promesa) => {
            Promise.resolve(promesa).then(resolve).catch((error) => {
                fallos += 1;
                ultimoError = error;

                if (fallos === promesas.length) reject(ultimoError);
            });
        });
    });
}

/**
 * Consulta Overpass con el bounding box visible y representa sólo nodos que
 * tengan nombre. Una solicitud nueva cancela cualquier rastrillaje anterior.
 */
async function ejecutarRastrillaje(rubroFiltro) {
    const filtrosOSM = obtenerValoresOSM(rubroFiltro);
    if (!filtrosOSM) {
        console.warn(`[TACTICAL_RADAR] Rubro no soportado: ${rubroFiltro}`);
        informarEnHUD("[ ERROR ] RUBRO_NO_RECONOCIDO");
        return;
    }

    if (solicitudActiva) solicitudActiva.abort();
    solicitudActiva = new AbortController();
    const controladorLocal = solicitudActiva;

    /* Los nodos locales se muestran primero y no dependen de la red. */
    limpiarResultados();
    const lista = document.getElementById("lista-comercios");
    const nodosLocales = obtenerNodosLocales(rubroFiltro);

    nodosLocales.forEach((comercio) => crearMarcadorYEntrada(comercio, lista));
    actualizarEstadoHUD(nodosLocales.length, rubroFiltro);

    if (!nodosLocales.length) {
        informarEnHUD("[ SCAN ] CONSULTANDO_RED_OSM...");
    }

    const bounds = map.getBounds();
    const query = construirConsultaOverpass(filtrosOSM, bounds);
    let tiempoAgotado = false;

    /* Feedback adicional si la red tarda, sin esperar al timeout definitivo. */
    const avisoRedLenta = setTimeout(() => {
        if (solicitudActiva === controladorLocal) {
            if (nodosLocales.length) {
                console.warn("[TACTICAL_RADAR] Red OSM lenta; los nodos locales siguen operativos");
            } else {
                informarEnHUD("[ SCAN ] RED_LENTA // FAILOVER_ACTIVO...");
            }
        }
    }, 3500);

    /* Ningún botón puede quedar esperando indefinidamente. */
    const limiteConsulta = setTimeout(() => {
        tiempoAgotado = true;
        controladorLocal.abort();
    }, 12000);

    try {
        /*
         * Ambos espejos compiten en paralelo. La utilidad compatible usa la
         * primera respuesta válida y sólo falla cuando ambos servidores fallan.
         * No se agregan headers personalizados para evitar preflights CORS.
         */
        const datos = await primeraRespuestaValida(
            OVERPASS_ENDPOINTS.map((endpoint) =>
                consultarEspejoOverpass(endpoint, query, controladorLocal.signal)
            )
        );

        clearTimeout(avisoRedLenta);
        clearTimeout(limiteConsulta);

        /* Ignora una respuesta antigua si ya comenzó otro escaneo. */
        if (solicitudActiva !== controladorLocal) return;

        /* Cancela el espejo perdedor una vez obtenida una respuesta válida. */
        controladorLocal.abort();

        const nodosConNombre = datos.elements.filter((elemento) =>
            elemento.type === "node" &&
            Number.isFinite(elemento.lon) &&
            Number.isFinite(elemento.lat) &&
            elemento.tags &&
            elemento.tags.name
        );

        /* Quita el mensaje de escaneo sólo cuando no había resultados locales. */
        if (!nodosLocales.length) lista.replaceChildren();

        const totalDetectado = nodosLocales.length + nodosConNombre.length;
        actualizarEstadoHUD(totalDetectado, rubroFiltro);

        if (!totalDetectado) {
            informarEnHUD("[ 000 ] SIN_NODOS_EN_SECTOR_VISIBLE");
            return;
        }

        nodosConNombre.forEach((nodo) => {
            const nombreReal = nodo.tags.name.trim();
            const comercio = {
                id: nodo.id,
                nombreReal,
                nombreTactico: crearNombreTactico(nombreReal, rubroFiltro),
                coordenadas: [nodo.lon, nodo.lat],
                direccion: obtenerDireccion(nodo.tags, nodo.lon, nodo.lat),
                info: "",
                esLocal: false
            };

            crearMarcadorYEntrada(comercio, lista);
        });
    } catch (error) {
        if (error.name === "AbortError" && !tiempoAgotado) return;

        console.error("[TACTICAL_RADAR] Falló el enlace con Overpass:", error);

        /* Verdulerías conserva su base local aun si todos los espejos fallan. */
        if (nodosLocales.length) {
            actualizarEstadoHUD(nodosLocales.length, rubroFiltro);
        } else {
            limpiarResultados();
            informarEnHUD(
                tiempoAgotado
                    ? "[ TIMEOUT ] RED_OSM_SIN_RESPUESTA"
                    : "[ ERROR ] ENLACE_OVERPASS_NO_DISPONIBLE"
            );
        }
    } finally {
        clearTimeout(avisoRedLenta);
        clearTimeout(limiteConsulta);
        if (solicitudActiva === controladorLocal) solicitudActiva = null;
    }
}

/* API pública y alias compatibles con las versiones anteriores de la UI. */
window.cambiarSectorTactico = cambiarSectorTactico;
window.ejecutarRastrillaje = ejecutarRastrillaje;
window.rastrearComercios = ejecutarRastrillaje;
