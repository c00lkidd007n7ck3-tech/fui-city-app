// Centrado por defecto en Buenos Aires, podés cambiarlo por tu latitud y longitud
const map = L.map('map', { zoomControl: false }).setView([-34.6037, -58.3816], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Lugares ficticios para testear el escáner
const comerciosDeLaCiudad = [
    { rubro: 'gastronomia', nombre: 'CYBER_BURGER_01', coords: [-34.6050, -58.3830] },
    { rubro: 'salud', nombre: 'MED_NODE_ALPHA', coords: [-34.6020, -58.3800] },
    { rubro: 'comercios', nombre: 'SUPPLY_STORE_X', coords: [-34.6070, -58.3810] }
];

let marcadoresEnPantalla = [];

function filtrar(rubroSeleccionado) {
    marcadoresEnPantalla.forEach(marcador => map.removeLayer(marcador));
    marcadoresEnPantalla = [];

    comerciosDeLaCiudad.forEach(comercio => {
        if (comercio.rubro === rubroSeleccionado) {
            const nuevoMarcador = L.circleMarker(comercio.coords, {
                radius: 8,
                fillColor: '#ff0033',
                color: '#ffffff',
                weight: 1.5,
                fillOpacity: 0.8
            }).addTo(map);

            nuevoMarcador.bindPopup(`<b style="color:#000;">[ ${comercio.nombre} ]</b>`);
            marcadoresEnPantalla.push(nuevoMarcador);
        }
    });
}
