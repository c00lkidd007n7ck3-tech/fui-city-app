# Market Map (Tu Guía Local)

## Descripción

Market Map es una aplicación híbrida móvil optimizada bajo el enfoque **Mobile First**, con una interfaz táctica de estética **FUI/Cyberpunk** basada en rojo neón sobre fondo oscuro. Permite visualizar comercios zonales clasificados por categorías.

## Tecnologías utilizadas

- **Frontend:** HTML5, CSS3 (Flexbox y CSS Variables) y JavaScript nativo.
- **Core híbrido:** Capacitor de Ionic, utilizado para empaquetar la estructura web como una aplicación nativa.
- **Entorno nativo:** Android Studio, para compilación y pruebas sobre un emulador Pixel 8.
- **Diseño de assets:** GIMP, con un archivo maestro de 1080 × 1080 px exportado en formato WebP y procesado mediante remuestreo Lanczos.

## Arquitectura de directorios clave

```text
.
├── www/                 # Fuentes web: index.html, style.css y app.js
├── android/             # Módulo nativo de Capacitor para Gradle y Android Studio
└── market_map.webp      # Logo maestro optimizado
```

### `/www`

Contiene los archivos fuente de la aplicación web:

- `index.html`: estructura principal de la interfaz.
- `style.css`: estilos visuales y diseño responsivo.
- `app.js`: comportamiento e interacciones de la aplicación.

### `/android`

Módulo nativo generado por Capacitor. Aloja la configuración de Gradle y el proyecto utilizado por Android Studio para compilar, probar y distribuir la aplicación.

### `/market_map.webp`

Logo maestro optimizado del proyecto, almacenado en la raíz del repositorio.

## Comandos esenciales del flujo de trabajo

### Sincronizar cambios web con Android

```bash
npx cap sync
```

### Ejecución y distribución

- **Pruebas:** abrir el módulo Android en Android Studio y ejecutar la variante `debug` sobre un emulador Pixel 8.
- **Producción:** utilizar el asistente **Generate Signed Bundle/APK** de Android Studio en modo `release`.

## Hitos alcanzados hoy

- Configuración de la identidad de marca interna y de iconos `mipmap` multirresolución, desde 48 px hasta 192 px.
- Refactorización completa hacia un diseño responsivo elástico bajo el enfoque Mobile First.
- Implementación de controles interactivos (`toggle`) para desplegar paneles y de un submenú expandible para las categorías secundarias.
