# From Presentation to Proof

Single-page scroll narrative prototype built with vanilla HTML/CSS/JS.

## Thesis
Presentation artifacts explain intent.
Interactive prototypes prove behavior.

## Current Product Example
Motion-design workflow for a title animation module where particles emit as text is written.

### Left: Presentation Artifacts (Old Process)
- Content doc excerpt
- Sketch/wireframe concepts
- State/logic flowchart
- Pre-rendered demo placeholder (non-interactive loop)

### Right: Interactive Proof
Text Microinteraction Customizer with live preview.

Controls:
- Text animation speed
- Particle speed
- Particle density
- Particle lifespan
- Particle size
- Particle opacity
- Custom text input + Play

## Technical Notes
- No external libraries
- Canvas-based title reveal + particle system
- Scroll-driven shift uses CSS variables (`--v`, `--p`, `--crack`, `--depth`)
- High-DPI canvas scaling (`devicePixelRatio`)
- Particle cap for performance
- `prefers-reduced-motion` renders static final title by default

## Files
- `index.html`
- `styles.css`
- `app.js`
