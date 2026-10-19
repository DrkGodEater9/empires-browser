# Mini Imperios

RTS 2D de navegador estilo Age of Empires. Canvas + JavaScript puro (módulos ES), empaquetado con Vite. Sin assets externos: gráficos y audio son procedurales.

## Correr

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
npm run preview    # sirve dist/
```

## Jugabilidad

- Recolecta 🍖 🪵 🪙, construye, entrena y destruye todos los edificios enemigos.
- **Edades** (Aldea → Castillo → Imperial) desde el Centro Urbano; desbloquean Torre, Establo y Herrería (Castillo) y Taller de asedio (Imperial).
- **Unidades:** aldeano, soldado, arquero, caballero (rápido, fuerte vs arqueros), catapulta (daño en área, devastadora contra edificios).
- **Herrería:** mejoras de ataque y armadura.
- **Niebla de guerra:** sin explorar / explorado / visible.
- **IA** con tres dificultades; **sonido** sintetizado (tecla M para silenciar).

Controles: click izq seleccionar (arrastrar = caja, doble click = mismo tipo) · click der ordenar · flechas/bordes cámara · rueda zoom · Q W E R T Y U botones · A+click atacar-mover · S detener · H base · P pausa.

## Estructura

```
index.html
vite.config.js
src/
  main.js              arranque y bucle principal
  config/              constants.js (números fijos) · data.js (unidades, edificios, edades, IA)
  core/                state.js (estado compartido) · events.js (bus) · world.js · pathfinding.js · map.js · camera.js · util.js
  systems/             units · combat · economy · orders · ai · fog · game (lógica sin DOM)
  render/              renderer · terrain · sprites · minimap
  ui/                  hud · commandPanel · input
  audio/               sound.js
  styles/              main.css
  dev/                 selftest.js
```

Regla de capas: `systems/` y `core/` no tocan el DOM; hablan con la UI y el audio por eventos (`core/events.js`: `toast`, `sfx`, `selection`, `game:start`, `game:over`).

## Test sin interfaz

Con el servidor corriendo, abrir `/?test` simula una partida IA vs IA y deja el resumen en `<pre id="out">`. `/?test&rich` da recursos abundantes para ejercitar edades, mejoras y unidades avanzadas.
