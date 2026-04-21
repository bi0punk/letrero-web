# 🔴 LED Sign Studio v2.0

Editor avanzado de carteles tipo LED / neón con Flask.

## ✨ Novedades v2.0

- **Multi-color por frases**: Separa frases con `|` y cada una tendrá un color LED diferente  
  Ejemplo: `ABIERTO|KIOSCO|PIZZA` → rojo | amarillo | verde
- **Puntos LED en borde**: Ornamento de puntos LED multicolor alrededor del cartel
- **Nuevos estilos**: Pixel Grid, Plasma animado, Retro neon (estilo tienda)
- **Efectos de texto**: Rainbow, Fuego, Hielo, Matrix
- **Nueva fuente**: Share Tech Mono (estilo digital)
- **Dashboard renovado**: UI más clara, paleta LED visible

## 🚀 Cómo ejecutar

```bash
pip install flask
python run.py
# Abre http://localhost:5000
```

O con el script:
```bash
chmod +x start.sh
./start.sh
```

## 📋 Formato de mensaje multi-color

```
FRASE1|FRASE2|FRASE3
```

Cada segmento recibe un color de la paleta LED (rojo, amarillo, verde, azul, magenta, cyan, naranja, blanco).

## 🎨 Estilos disponibles

| Estilo | Descripción |
|--------|-------------|
| LED Matrix | Punto luminoso por píxel, el más realista |
| Neón clásico | Glow pulsante con animación |
| Pixel Grid | Cuadrícula de píxeles |
| Plasma | Fondo animado psicodélico |
| Retro neon | Estilo carteles de tienda |
| LED simple | Glow básico |
| LCD Retro | Estilo pantalla verde antigua |
| Billboard | Letras grandes y proyección |
| Minimal | Sin efectos |

## ⌨️ Atajos

- `F` → Pantalla completa
- `Espacio` → Pausar animación
- `R` → Reiniciar animación
