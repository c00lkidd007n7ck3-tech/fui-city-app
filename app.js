// Usamos un estilo libre open-source que renderiza perfectamente en 3D
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    center: [-58.3816, -34.6037], // Buenos Aires (Cambialo por tu ciudad)
    zoom: 14.5,
    pitch: 60,       // Grados de inclinación de la cámara para ver en perspectiva 3D
    bearing: -20,    // Rotación del mapa con respecto al norte
    zoomControl: false
});

// Hacemos que el mapa rote lentamente de fondo de forma continua tipo radar militar
function animarRadar() {
    map.rotateTo((map.getBearing() + 0.05) % 360, { duration: 0 });
    requestAnimationFrame(animarRadar);
}

map.on('load', () => {
    animarRadar();
});

// Puntos de datos espaciales tácticos
const nodosUrbanos = [
    { rubro: 'gastronomia', nombre: 'FUEL_NODE_G01', coords: [-58.3830, -34.6050] },
    { rubro: 'salud', nombre: 'MED_BAY_ALPHA', coords: [-58.3800, -34.6020] },
    { rubro: 'comercios', nombre: 'DEPOT_ZONE_X', coords: [-58.3810, -34.6070] }
];

let marcadoresActuales = [];

function filtrar(rubroSeleccionado) {
    // Borrar nodos anteriores
    marcadoresActuales.forEach(m => m.remove());
    marcadoresActuales = [];

    nodosUrbanos.forEach(nodo => {
        if (nodo.rubro === rubroSeleccionado) {

            // Creamos un elemento HTML personalizado en 3D (un anillo holográfico)
            const el = document.createElement('div');
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.border = '2px solid #fff';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#ff0033';
            el.style.boxShadow = '0 0 12px #ff0033, inset 0 0 8px #ff0033';
            el.style.animation = 'blink 0.8s infinite alternate';

            // Lo colocamos sobre las coordenadas en el plano interactivo 3D
            const marcador = new maplibregl.Marker({ element: el })
                .setLngLat(nodo.coords)
                .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<p style="color:#000; font-family:monospace;"><b>[${nodo.nombre}]</b></p>`))
                .addTo(map);

            marcadoresActuales.push(marcador);
        }
    });
}
