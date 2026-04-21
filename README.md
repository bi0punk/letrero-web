# LED Sign Studio v3.0

Editor avanzado de carteles LED y neón con Flask, ahora con escenas matriciales programables inspiradas en paneles LED físicos de 20x64.

## Novedades v3.0

- Nuevo modo `Escena matricial animada` sin romper el modo clásico de texto.
- Plantillas rápidas tipo panel programable:
  - Hello + emoji
  - Ojos animados
  - Corazones pulse
  - Festivo / navidad
  - STOP + bus
  - Flecha + texto
- Render por canvas con apariencia de matriz LED real.
- Reflejo inferior tipo panel promocional.
- Destellos de fondo y brillo de panel configurables.
- Soporte para emojis laterales en escenas.
- Presets siguen funcionando y pueden guardar tanto modo texto como modo escena.

## Cómo ejecutar

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Abrir en el navegador:

```bash
http://127.0.0.1:5000
```

## Modos disponibles

### 1. Texto / cartel clásico
Mantiene el comportamiento original:
- marquee
- bounce
- static
- estilos neon / led / literal led / pixel / plasma / retro / lcd / billboard / minimal

### 2. Escena matricial animada
Usa un motor canvas nuevo para composiciones tipo panel LED:
- `custom_banner`
- `emoji_parade`
- `eyes`
- `hearts`
- `festive`
- `stop_bus`
- `arrow_text`

## Atajos

- `F` -> pantalla completa
- `Espacio` -> pausa / reanuda
- `R` -> reinicia la vista cartel

## Nota técnica

El nuevo motor matricial fue agregado como capa separada (`matrix_engine.js`) para no alterar el flujo ya existente del render clásico.
