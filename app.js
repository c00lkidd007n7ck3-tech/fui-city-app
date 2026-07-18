// 1. Configuramos el mapa base vectorial con inclinación 3D (pitch)
// Nota: Las coordenadas están en Buenos Aires. Modificá el "center" si querés tu ciudad.
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    center: [-58.3816, -34.6037],
    zoom: 14.5,
    pitch: 60,       // Ángulo de inclinación oblicuo
    bearing: -20,    // Rotación inicial
    zoomControl: false
});

let rotacionActiva = true;
let temporizadorRetorno;

// Bucle de rotación autónoma (Efecto Radar)
function animarRadar() {
    if (rotacionActiva) {
        map.rotateTo((map.getBearing() + 0.04) % 360, { duration: 0 });
        requestAnimationFrame(animarRadar);
    }
}

map.on('load', () => {
    animarRadar();
});

// Interrupción inteligente de animación al interactuar
function pausarEscaner() {
    rotacionActiva = false;
    clearTimeout(temporizadorRetorno);

    // Si pasan 5 segundos sin tocar el mapa, vuelve a rotar automáticamente
    temporizadorRetorno = setTimeout(() => {
        if (!rotacionActiva) {
            rotacionActiva = true;
            animarRadar();
        }
    }, 5000);
}

// Escuchas de eventos para pausar (Mouse, teclado y pantallas táctiles de móviles)
map.on('movestart', pausarEscaner);
map.on('touchstart', pausarEscaner);


// 2. Base de datos simulada de los rubros comerciales
const nodosUrbanos = [
    { rubro: 'gastronomia', nombre: 'FUEL_NODE_G01', coords: [-58.3830, -34.6050] },
    { rubro: 'salud', nombre: 'MED_BAY_ALPHA', coords: [-58.3800, -34.6020] },
    { rubro: 'comercios', nombre: 'DEPOT_ZONE_X', coords: [-58.3810, -34.6070] }
];

let marcadoresActuales = [];

// Función encargada de renderizar los nodos en el espacio 3D
function filtrar(rubroSeleccionado) {
    // Limpiamos los anteriores del mapa
    marcadoresActuales.forEach(m => m.remove());
    marcadoresActuales = [];

    nodosUrbanos.forEach(nodo => {
        if (nodo.rubro === rubroSeleccionado) {

            // Diseñamos un anillo luminoso customizado mediante código
            const el = document.createElement('div');
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.border = '2px solid #fff';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#ff0033';
            el.style.boxShadow = '0 0 12px #ff0033, inset 0 0 8px #ff0033';

            // Fijamos el marcador tridimensional sobre la cartografía
            const marcador = new maplibregl.Marker({ element: el })
                .setLngLat(nodo.coords)
                .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<p style="color:#000; font-family:monospace; margin:3px;"><b>[${nodo.nombre}]</b></p>`))
                .addTo(map);

            marcadoresActuales.push(marcador);
        }
    });
}
