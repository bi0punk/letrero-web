# Cartel web LED / Neón con Flask

Aplicación web para crear y mostrar carteles tipo neón, LED matrix, LCD retro o billboard desde una interfaz web.  
Incluye editor visual, emojis rápidos, presets persistidos en SQLite, vista previa en tiempo real y una ruta dedicada para pantalla completa.

## Qué trae esta versión

- Flask + Bootstrap 5
- Vista previa en tiempo real
- Modos visuales:
  - Neón
  - LED Matrix, LED literal
  - LCD Retro
  - Billboard
  - Minimal
- Modos de animación:
  - Carrusel continuo
  - Lado a lado
  - Estático
- Configuración de:
  - Texto
  - Colores
  - Fuente
  - Tamaño
  - Velocidad
  - Glow
  - Brillo
  - Padding
  - Bordes
  - Opacidad del panel
  - Mayúsculas automáticas
  - Parpadeo
  - Textura de fondo
  - Contorno
- Botonera de emojis rápidos
- Guardado y borrado de presets
- Exportación JSON
- Vista dedicada `/display` para usar en otra pantalla o TV
- Fullscreen con `screenfull.js`

---

## Estructura del proyecto

```text
cartel_flask_led_neon/
├── run.py
├── requirements.txt
├── README.md
└── cartel_app/
    ├── __init__.py
    ├── db.py
    ├── defaults.py
    ├── routes.py
    ├── templates/
    │   ├── base.html
    │   ├── dashboard.html
    │   └── display.html
    └── static/
        ├── css/
        │   └── app.css
        └── js/
            ├── dashboard.js
            └── display.js
```

---

## Requisitos

- Python 3.10 o superior
- Linux recomendado
- Navegador moderno

---

## Ejecución rápida

### 1) Crear entorno virtual

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2) Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3) Ejecutar

```bash
python run.py
```

### 4) Abrir en navegador

```text
http://127.0.0.1:5000
```

Si quieres usarlo desde otra máquina de la red:

```bash
python run.py
```

Luego abre:

```text
http://IP_DE_TU_MAQUINA:5000
```

---

## Cómo usar

### Editor principal
Desde la pantalla principal puedes:

1. Escribir el texto del cartel
2. Agregar emojis
3. Cambiar estilo, animación, fuente y colores
4. Ajustar glow, velocidad, tamaño, padding y bordes
5. Ver el resultado en vivo
6. Guardar presets en SQLite

### Vista cartel
Presiona **Abrir vista cartel**.

Esto abre una pestaña dedicada con el cartel listo para:
- monitor secundario
- TV
- kiosco
- pantalla HDMI
- navegador en fullscreen

Atajos disponibles:
- `F`: fullscreen
- `Espacio`: pausar/reanudar animación
- `R`: reiniciar

---

## Persistencia

Los presets quedan guardados en:

```text
instance/carteles.db
```

No se necesita configurar nada extra.

---

## Consideraciones técnicas

### 1. Backend
El backend es intencionalmente simple:
- Flask
- SQLite nativo
- API REST mínima para presets

### 2. Frontend
La lógica visual está en JavaScript puro:
- render dinámico del cartel
- serialización de configuración
- apertura de vista `/display?cfg=...`

### 3. Fullscreen
Se usa `screenfull.js` cuando está disponible.  
Si el navegador lo bloquea, igual puedes entrar manualmente a fullscreen con `F11`.

### 4. Fuentes y assets CDN
Bootstrap, Bootstrap Icons, Google Fonts y `screenfull.js` se cargan por CDN.  
La app funciona mejor con conexión a internet para esas librerías externas.

Si luego quieres una versión 100% offline, puedes:
- descargar Bootstrap local
- descargar fuentes localmente
- dejar `screenfull.js` dentro de `static/vendor/`

---

## Endpoints útiles

### UI
- `GET /` → editor
- `GET /display?cfg=...` → vista cartel dedicada

### API
- `GET /api/default-config`
- `GET /api/presets`
- `GET /api/presets/<id>`
- `POST /api/presets`
- `DELETE /api/presets/<id>`

---

## Ejemplo de payload para guardar un preset

```json
{
  "name": "Promo noche",
  "config": {
    "preset_name": "Promo noche",
    "message": "🔥 2x1 hoy 🚀",
    "style": "neon",
    "animation_mode": "marquee",
    "direction": "left",
    "font_family": "orbitron",
    "font_size": 128,
    "speed": 12,
    "text_color": "#ffd166",
    "background_color": "#050505",
    "accent_color": "#ff7b00",
    "glow": 80,
    "brightness": 110,
    "letter_spacing": 4,
    "padding_x": 40,
    "padding_y": 18,
    "border_radius": 20,
    "border_width": 1,
    "uppercase": false,
    "blink": false,
    "outline": false,
    "shadow_enabled": true,
    "show_background_grid": true,
    "container_opacity": 100
  }
}
```

---

## MVP → mejora → producción

### MVP actual
- Editor visual
- Presets
- Fullscreen
- Animación
- Emojis

### Mejoras naturales
- playlist de mensajes
- programación por horarios
- rotación automática entre presets
- websocket para cambio en vivo sin recargar
- modo kiosko
- carga de logos o imágenes
- fondos en video
- control remoto desde móvil
- autenticación
- multiusuario

### Producción
Para llevarlo a producción local o intranet:
- gunicorn
- nginx
- systemd
- reverse proxy
- autenticación básica
- rate limit
- assets locales en vez de CDN

---

## Idea de despliegue en una Raspberry Pi o mini PC

```text
[ Navegador admin ] ---> [ Flask editor ]
                               |
                               +--> [ SQLite presets ]
                               |
                               +--> [ /display en otra pantalla/TV ]
```

Esto sirve muy bien para:
- locales comerciales
- ferias
- señalética digital simple
- promociones internas
- recepciones
- salas de espera

---

## Licencia / uso

Úsalo como base libre para tu MVP y ajústalo a tu branding.
