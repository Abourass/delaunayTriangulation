# Delaunay Triangulation

A modular, extensible library for Delaunay triangulation using the Bowyer-Watson algorithm.

## Features

- **Modular Architecture**: Clean separation of concerns with distinct modules for geometry, algorithms, rendering, and generators
- **Extensible Design**: Easy to add new point generators, rendering backends, or triangulation algorithms
- **Pure Geometry Classes**: Core classes (Point, Edge, Triangle) focus solely on geometry, making them testable and reusable
- **Strategy Pattern**: Pluggable point generators (random, grid, circular) and potential for multiple rendering backends
- **Canvas Rendering**: Beautiful visualization with customizable styling
- **Comprehensive Testing**: Unit-testable components without browser dependencies

## Architecture

```
src/
├── core/           # Core geometry primitives
│   ├── Point.mjs       # 2D point/vector operations
│   ├── Edge.mjs        # Line segment between two points
│   ├── Triangle.mjs    # Triangle with circumcircle operations
│   └── index.mjs       # Barrel exports
├── algorithms/     # Triangulation algorithms
│   └── BowyerWatson.mjs  # Incremental Delaunay algorithm
├── generators/     # Point generation strategies
│   └── PointGenerator.mjs  # Random, Grid, Circular generators
├── rendering/      # Rendering backends
│   ├── Renderer.mjs        # Abstract base class
│   └── CanvasRenderer.mjs  # HTML5 Canvas implementation
├── app/            # Application orchestration
│   └── DelaunayApp.mjs     # Main application class
├── main.mjs        # Browser entry point
└── index.mjs       # Library exports
```

## Quick Start

### Browser Usage

Open `index.html` in a browser. Click anywhere on the canvas to regenerate the triangulation.

```bash
# Or serve locally
npx http-server . -p 8080 -o
```

### Library Usage

```javascript
import { Point, Triangle, BowyerWatson } from './src/index.mjs';

// Create points
const points = [
  new Point(10, 10),
  new Point(50, 10),
  new Point(30, 50)
];

// Create super triangle (must contain all points)
const superTriangle = new Triangle(
  new Point(-100, 200),
  new Point(200, 200),
  new Point(50, -200)
);

// Perform triangulation
const triangles = BowyerWatson.triangulate(points, superTriangle);
```

### Custom Point Generation

```javascript
import { DelaunayApp, PointGeneratorFactory } from './src/index.mjs';

const app = new DelaunayApp({ canvas });
app.setup();

// Switch to grid pattern
app.setPointGeneratorByName('grid');
app.setPointGeneratorOptions({ rows: 10, cols: 10, jitter: 0.3 });
app.draw();

// Or circular pattern
app.setPointGeneratorByName('circular');
app.setPointGeneratorOptions({ rings: 5, pointsPerRing: 8 });
app.draw();
```

### Custom Rendering

```javascript
const app = new DelaunayApp({
  canvas,
  renderOptions: {
    strokeStyle: '#333',
    lineWidth: 2,
    drawInteriorLines: true,
    interiorLineCount: 5
  }
});
```

## Running Tests

```bash
node tests/core.test.mjs
```

## Extending the Library

### Add a Custom Point Generator

```javascript
import { PointGenerator } from './src/generators/PointGenerator.mjs';

class SpiralPointGenerator extends PointGenerator {
  generate(width, height, options = {}) {
    // Your spiral generation logic
    return points;
  }
}

// Register it
PointGeneratorFactory.register('spiral', SpiralPointGenerator);
```

### Add a Custom Renderer

```javascript
import { Renderer } from './src/rendering/Renderer.mjs';

class SVGRenderer extends Renderer {
  renderTriangle(triangle, style = {}) {
    // SVG rendering logic
  }
  // ... implement other methods
}
```

## Key Improvements Over Original

1. **Testability**: All core classes can be unit tested without browser/canvas dependencies
2. **Separation of Concerns**: Geometry logic is separate from rendering
3. **No Global State**: All state is encapsulated in classes
4. **Extensibility**: Easy to add new generators, renderers, or algorithms
5. **Modern ES Modules**: Clean import/export structure
6. **Performance Optimizations**: Circumcircle caching, squared distance calculations

## References

- [Bowyer-Watson Algorithm](https://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm)
- [Delaunay Triangulation](https://en.wikipedia.org/wiki/Delaunay_triangulation)
- [Circumscribed Circle](https://en.wikipedia.org/wiki/Circumscribed_circle)

## License

MIT
