# Delaunay Triangulation

An interactive Delaunay triangulation visualization built with SolidJS, Vite, and Kobalte components.

## Features

- **Interactive UI**: Real-time control panel with Kobalte components
- **Reactive Updates**: SolidJS fine-grained reactivity for instant feedback
- **Multiple Generators**: Switch between Random, Grid, and Circular point patterns
- **Adjustable Parameters**: Control point count with an interactive slider
- **Modern Build System**: Vite for fast development and optimized production builds
- **Auto-Deploy**: GitHub Pages deployment via GitHub Actions
- **Modular Architecture**: Clean separation of geometry, algorithms, and rendering

## Live Demo

Visit the [GitHub Pages deployment](https://abourass.github.io/delaunayTriangulation/) to try it live!

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 to view the app.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

```
src/
├── core/               # Core geometry primitives
│   ├── Point.mjs          # 2D point/vector operations
│   ├── Edge.mjs           # Line segment between two points
│   ├── Triangle.mjs       # Triangle with circumcircle operations
│   └── index.mjs          # Barrel exports
├── algorithms/         # Triangulation algorithms
│   └── BowyerWatson.mjs   # Incremental Delaunay algorithm
├── generators/         # Point generation strategies
│   └── PointGenerator.mjs # Random, Grid, Circular generators
├── rendering/          # Rendering backends
│   ├── Renderer.mjs       # Abstract base class
│   └── CanvasRenderer.mjs # HTML5 Canvas implementation
├── App.tsx             # Main SolidJS application component
├── index.tsx           # Application entry point
└── styles.css          # Global styles and Kobalte theming
```

## Using the App

1. **Select Generator**: Use the dropdown to choose between:
   - **Random**: Uniformly distributed random points
   - **Grid**: Points arranged in a grid with optional jitter
   - **Circular**: Points arranged in concentric circles

2. **Adjust Point Count**: Use the slider to control how many points are generated (10-200)

3. **Regenerate**: Click the button or anywhere on the canvas to generate a new triangulation

4. **View Stats**: See real-time statistics including point count, triangle count, and canvas dimensions

## Technology Stack

- **[SolidJS](https://www.solidjs.com/)**: Fine-grained reactive UI framework
- **[Vite](https://vitejs.dev/)**: Next-generation frontend build tool
- **[Kobalte](https://kobalte.dev/)**: Accessible UI component library for SolidJS
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **Canvas 2D API**: Hardware-accelerated rendering

## Library Usage

The core modules can be used independently:

```javascript
import { Point, Triangle } from './src/core/index.mjs';
import { BowyerWatson } from './src/algorithms/BowyerWatson.mjs';
import { RandomPointGenerator } from './src/generators/PointGenerator.mjs';

// Generate points
const generator = new RandomPointGenerator();
const points = generator.generate(800, 600, { count: 50 });

// Create super triangle
const superTriangle = new Triangle(
  new Point(-1600, 1200),
  new Point(1600, 1200),
  new Point(400, -1200)
);

// Perform triangulation
const triangles = BowyerWatson.triangulate(points, superTriangle);
console.log(`Generated ${triangles.length} triangles`);
```

## Running Tests

```bash
npm test
```

## Extending

### Add a Custom Point Generator

```typescript
import { PointGenerator } from './src/generators/PointGenerator.mjs';
import { Point } from './src/core/Point.mjs';

class SpiralPointGenerator extends PointGenerator {
  generate(width: number, height: number, options: any = {}): Point[] {
    const points: Point[] = [];
    const count = options.count ?? 50;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 8;
      const radius = (i / count) * Math.min(width, height) * 0.4;
      points.push(new Point(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      ));
    }

    return points;
  }
}
```

### Add New Controls

The SolidJS architecture makes it easy to add new reactive controls:

```tsx
const [showCircumcircles, setShowCircumcircles] = createSignal(false);

// In render effect
createEffect(() => {
  if (showCircumcircles()) {
    triangles().forEach(t => renderer.renderCircumcircle(t));
  }
});
```

## Deployment

The app automatically deploys to GitHub Pages on push to main/master via GitHub Actions. The workflow:

1. Checks out the code
2. Sets up Node.js 20
3. Installs dependencies with `npm ci`
4. Builds with `npm run build`
5. Deploys the `dist/` folder to GitHub Pages

## References

- [Bowyer-Watson Algorithm](https://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm)
- [Delaunay Triangulation](https://en.wikipedia.org/wiki/Delaunay_triangulation)
- [SolidJS Documentation](https://www.solidjs.com/docs/latest)
- [Kobalte Components](https://kobalte.dev/docs/core/overview/introduction)

## License

MIT
