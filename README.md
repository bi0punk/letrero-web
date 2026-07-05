# LED Sign Studio

[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1%2B-000000?logo=flask)](https://flask.palletsprojects.com/)
[![CI](https://github.com/drbash/letrero-web/actions/workflows/ci.yml/badge.svg)](https://github.com/drbash/letrero-web/actions)

Editor avanzado de carteles LED y neón con Flask. Soporta modo texto clásico y escenas matriciales animadas tipo panel LED físico de 20x64.

## Contenido

- [Características](#caracter%C3%ADsticas)
- [Stack](#stack)
- [Estructura](#estructura)
- [Requisitos](#requisitos)
- [Instalación](#instalaci%C3%B3n)
- [Uso](#uso)
- [Modos disponibles](#modos-disponibles)
- [Atajos de teclado](#atajos-de-teclado)
- [API](#api)
- [Tests](#tests)
- [Configuración](#configuraci%C3%B3n)
- [CI/CD](#cicd)
- [Limitaciones / Roadmap](#limitaciones--roadmap)
- [Licencia](#licencia)

## Características

- **Modo texto clásico**: marquee, bounce, static con múltiples estilos LED
- **Escenas matriciales animadas**: composiciones tipo panel LED programable
- **10+ estilos visuales**: neon, led, literal_led, pixel, plasma, retro, lcd, billboard, minimal
- **Soporte para emojis**: emojis laterales y en escenas
- **Reflejo inferior**: efecto de panel promocional
- **Presets**: guardar y cargar configuraciones personalizadas
- **Pantalla completa**: atajo `F` para modo inmersivo
- **Pausa / reanudar**: espacio para controlar animación

## Stack

| Componente | Tecnología |
|---|---|
| Backend | Python 3.11+, Flask 3.1+ |
| Frontend | HTML5, CSS3, JavaScript (canvas) |
| Motor matricial | `matrix_engine.js` (capa separada) |
| DB | SQLite (presets) |
| Testing | pytest |

## Estructura

```
letrero-web/
├── cartel_app/
│   ├── __init__.py         # Factory create_app()
│   ├── db.py               # SQLite (presets)
│   ├── defaults.py         # Config por defecto
│   ├── routes.py           # Rutas Flask + sanitización
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   │   ├── matrix_engine.js
│   │   │   └── main.js
│   │   └── fonts/
│   └── templates/
│       └── index.html
├── instance/               # DB sqlite (creado al ejecutar)
├── tests/
├── run.py                  # Entry point
├── start.sh                # Script de inicio
├── requirements.txt
├── .env.example
├── .github/workflows/ci.yml
├── pyproject.toml
└── README.md
```

## Requisitos

- Python 3.11+
- Navegador moderno (Chrome, Firefox, Edge)

## Instalación

```bash
git clone https://github.com/drbash/letrero-web.git
cd letrero-web
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Abrir en el navegador: [http://127.0.0.1:5000](http://127.0.0.1:5000)

## Uso

### Modo texto / cartel clásico

- `marquee`, `bounce`, `static`
- Estilos: neon, led, literal_led, pixel, plasma, retro, lcd, billboard, minimal

### Escena matricial animada

Motor canvas nuevo para composiciones tipo panel LED:

- `custom_banner`, `emoji_parade`, `eyes`, `hearts`, `festive`, `stop_bus`, `arrow_text`

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `F` | Pantalla completa |
| `Espacio` | Pausa / reanuda |
| `R` | Reinicia la vista |

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Interfaz principal |
| POST | `/api/config` | Guardar configuración |
| GET | `/api/config` | Cargar configuración |
| POST | `/api/presets` | Guardar preset |
| GET | `/api/presets` | Listar presets |

## Tests

```bash
pip install pytest
pytest tests/ -v
```

## Configuración

Variables de entorno (ver `.env.example`):

| Variable | Default | Descripción |
|---|---|---|
| `SECRET_KEY` | (autogenerado) | Clave secreta de Flask |

## CI/CD

GitHub Actions ejecuta lint (Ruff) y tests (pytest) en cada push/PR a main/master.

## Limitaciones / Roadmap

- [x] Modo texto clásico con 10 estilos
- [x] Escenas matriciales animadas
- [ ] Editor visual de escenas desde UI
- [ ] Exportar cartel como GIF animado
- [ ] Soporte multilenguaje (i18n)
- [ ] Modo oscuro / claro
- [ ] WebSockets para sincronización en tiempo real

## Licencia

MIT
