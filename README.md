# ◎ OBSERVABLE

> **The universe in your browser.**

**Observable** is an interactive 3D journey through the cosmos — from Earth and the Milky Way to neighboring galaxies, massive clusters, distant deep-field objects, and the edge of the observable universe.

Built entirely for the browser with **Three.js**, Observable combines procedural generation, real-time rendering, and an interactive navigation system to create a scale-inspired visualization of our cosmic neighborhood.

---

## ✦ Explore the Universe

Observable turns the browser into an interactive cosmic map.

Instead of navigating through conventional pages, you move through a continuously rendered 3D universe containing thousands of procedurally generated objects and large-scale structures.

Travel between landmarks such as:

- **Earth** — our pale blue dot
- **The Milky Way** — our home galaxy
- **Andromeda (M31)** — the nearest major spiral galaxy
- **Virgo Cluster** — a massive nearby galaxy cluster
- **The Great Attractor** — the gravitational region influencing our local universe
- **GN-z11** — an extremely distant high-redshift galaxy
- **The Cosmic Horizon** — the approximate boundary of the observable universe

> **Note:** The visualization is scale-inspired rather than a literal astronomical simulation. Distances, sizes, and visual density are adapted so enormously different cosmic scales can coexist in a navigable experience.

---

## ◎ Features

### Interactive 3D Universe

Navigate freely through a real-time WebGL environment using mouse, trackpad, keyboard, and built-in destination controls.

### Procedural Cosmic Generation

Large portions of the universe are generated programmatically rather than relying on static 3D assets.

The scene includes thousands of stars, galaxies, cosmic structures, and background objects while remaining lightweight enough to run directly in the browser.

### Cosmic Landmarks

Jump directly to important astronomical locations using the landmark navigation system or search interface.

Camera transitions smoothly carry you from one scale of the universe to another.

### Pale Blue Dot

Earth is intentionally represented as a minimal **pale blue orb** among the countless points of light in the Milky Way.

Rather than artificially enlarging Earth during navigation, the camera travels closer to the object — preserving the visual idea that our planet is simply one tiny point within a vastly larger universe.

### Procedural Galaxies

Spiral structures and galactic star distributions are generated mathematically, producing dense formations without requiring large external models.

### Cosmic Web

Large-scale structures help convey the filamentary organization of matter across enormous distances.

### Dynamic Labels

Landmark labels are projected from 3D space into the interface and respond to the camera's position and distance.

### Universe Search

Search for major destinations and immediately begin traveling toward them.

### Time Controls

Explore a simplified representation of cosmic development by changing the age of the universe and watching large-scale structures respond.

### Layer Controls

Individual visualization layers can be enabled or disabled, including:

- Cosmic web
- Galaxies
- Reference grid
- Labels

### Ambient Sound

An optional procedurally generated ambient soundscape adds atmosphere without requiring external audio files.

### Performance Monitoring

The interface exposes useful real-time information including frame rate, field of view, and rendered object counts.

---

## ◉ Navigation

Observable supports several ways to move through the universe.

### Mouse / Trackpad

- **Drag** to orbit the camera
- **Scroll / Pinch** to zoom

### Keyboard

| Key | Action |
| --- | --- |
| `W` | Move forward |
| `S` | Move backward |
| `A` | Move left |
| `D` | Move right |

Additional interface controls provide quick access to landmarks, search, visualization layers, sound, and the cosmic timeline.

---

## ◌ Technology

Observable is deliberately lightweight.

The core project is built with:

- **Three.js** — real-time 3D rendering and WebGL
- **JavaScript (ES Modules)** — simulation and interaction logic
- **Vite** — development tooling and bundling
- **HTML5**
- **CSS3**
- **Web Audio API** — procedural ambient audio
- **Canvas API** — runtime-generated visual assets

There is no traditional 3D game engine behind the experience.

**The universe is rendered directly in the browser.**

---

## ✧ Procedural Design

One of the project's core principles is generating complexity from code.

Instead of shipping an enormous collection of textures, models, and astronomical assets, Observable constructs much of its environment at runtime.

Procedural systems are used for elements such as:

```text
Star distributions
Spiral galaxies
Galaxy populations
Cosmic structures
Particle sizes and colors
Visual effects
Ambient audio
```

A deterministic seeded random generator helps keep the generated universe consistent between sessions.

This approach keeps the project relatively small while allowing the rendered environment to feel significantly larger than its source files.

---

## ◉ Cosmic Scale

Representing the universe accurately creates an unusual visualization problem.

The difference between planetary, galactic, intergalactic, and cosmological scales is so enormous that a completely literal representation would be nearly impossible to navigate.

Observable therefore uses a **scale-inspired model**.

The project preserves the *relationship and feeling* of cosmic scale while compressing astronomical distances into an environment humans can meaningfully explore.

It should be viewed as an interactive visualization rather than a scientific simulator or precision astronomical model.

---

## ◎ Project Structure

```text
observable-universe/
│
├── index.html
├── package.json
├── README.md
├── LICENSE
│
└── src/
    ├── main.js
    └── style.css
```

### `src/main.js`

Contains the primary visualization engine, including:

- Three.js scene creation
- Camera and orbit controls
- Procedural object generation
- Galaxy generation
- Cosmic-web generation
- Landmark definitions
- Earth visualization
- Camera flight system
- Search behavior
- Keyboard navigation
- Dynamic labels
- Timeline behavior
- Ambient audio
- Animation loop

### `src/style.css`

Contains the complete visual interface, responsive layout, panels, overlays, controls, typography, and UI effects.

### `index.html`

Defines the application interface and the canvas used by the Three.js renderer.

---

## ◌ Run Locally

### Requirements

You'll need a recent version of **Node.js** and npm.

Install the project's dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide a local address where the universe can be opened in your browser.

To create a production build locally:

```bash
npm run build
```

---

## ✦ Design Philosophy

Observable is built around a simple idea:

> **The universe should feel enormous, but exploring it should feel effortless.**

The interface deliberately stays subdued so that the visualization remains the focus.

Dark surfaces, restrained typography, translucent controls, minimal landmarks, and subtle animation are intended to make the application feel more like an astronomical instrument than a traditional website.

Earth follows the same philosophy.

It isn't presented as the dominant object in the scene. From a galactic perspective, it remains a tiny pale blue point — exactly where our journey begins.

---

## ◉ Performance

Real-time cosmic visualization can become expensive quickly.

Observable uses several techniques to keep rendering practical in a browser:

- GPU-rendered point systems
- Buffer geometries
- Procedural generation
- Shared materials
- Lightweight landmark geometry
- Controlled pixel ratios
- Limited geometry complexity
- Efficient animation updates
- Reduced reliance on external assets

Actual performance depends on the browser, display resolution, and GPU.

For the best experience, use a modern browser with hardware acceleration enabled.

---

## ✧ Browser Support

Observable is designed for modern browsers with **WebGL** and **ES Module** support.

Current versions of the following browsers should provide the best experience:

- Chrome
- Edge
- Firefox
- Safari

Mobile and lower-powered hardware may render fewer frames per second than desktop systems with dedicated graphics hardware.

---

## ◌ Accessibility

Observable includes conventional interface elements alongside its 3D visualization, including labeled controls and semantic buttons.

Because the central experience is inherently spatial and visual, accessibility remains an area where the project can continue to improve.

Contributions and ideas that make exploration of the universe accessible to more people are especially welcome.

---

## ✦ Contributing

Ideas, improvements, experiments, and pull requests are welcome.

Interesting areas for future development include:

- Additional astronomical landmarks
- More sophisticated galaxy morphology
- Improved scale transitions
- Expanded cosmic timeline behavior
- Additional accessibility features
- Mobile performance improvements
- More astronomical information for individual destinations
- Enhanced procedural generation
- Optional educational overlays
- Improved representation of large-scale cosmic structure

When contributing, try to preserve the project's central goal:

> **Maximum sense of scale with minimal visual clutter.**

---

## ⚠ Scientific Accuracy

Observable is an artistic and educational visualization inspired by real astronomical objects and scales.

It is **not intended for scientific measurement, research, navigation, or precision cosmological analysis**.

Positions, distances, object sizes, visual brightness, density, and relative scales may be transformed or compressed for presentation and navigability.

---

## License

This project is provided under the terms of the license included in the repository.

See [`LICENSE`](./LICENSE) for details.

---

<div align="center">

# ◎

### OBSERVABLE

**A pale blue dot in a very large universe.**

*Explore outward.*

</div>
