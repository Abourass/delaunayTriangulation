import { createSignal, createEffect, onMount, onCleanup, Show, For } from 'solid-js';
import { Select } from '@kobalte/core/select';
import { Slider } from '@kobalte/core/slider';
import { Checkbox } from '@kobalte/core/checkbox';
import { Point, Triangle, Edge } from './core/index.mjs';
import { BowyerWatson } from './algorithms/BowyerWatson.mjs';
import { CanvasRenderer } from './rendering/CanvasRenderer.mjs';
import {
  RandomPointGenerator,
  GridPointGenerator,
  CircularPointGenerator,
  SpiralPointGenerator,
  PoissonDiskPointGenerator,
} from './generators/PointGenerator.mjs';

interface GeneratorOption {
  value: string;
  label: string;
  description: string;
}

interface ColorModeOption {
  value: string;
  label: string;
}

const generatorOptions: GeneratorOption[] = [
  { value: 'random', label: 'Random', description: 'Uniformly distributed random points' },
  { value: 'grid', label: 'Grid', description: 'Points arranged in a grid pattern' },
  { value: 'circular', label: 'Circular', description: 'Points in concentric circles' },
  { value: 'spiral', label: 'Spiral', description: 'Golden ratio spiral pattern' },
  { value: 'poisson', label: 'Poisson Disk', description: 'Natural-looking distribution' },
  { value: 'interactive', label: 'Interactive', description: 'Click to place points' },
];

const colorModeOptions: ColorModeOption[] = [
  { value: 'none', label: 'No Fill' },
  { value: 'area', label: 'By Area' },
  { value: 'aspect', label: 'By Aspect Ratio' },
  { value: 'random', label: 'Random Colors' },
];

function App() {
  let canvasRef: HTMLCanvasElement | undefined;
  let renderer: CanvasRenderer | undefined;

  // Core state
  const [selectedGenerator, setSelectedGenerator] = createSignal('random');
  const [pointCount, setPointCount] = createSignal(50);
  const [triangles, setTriangles] = createSignal<Triangle[]>([]);
  const [points, setPoints] = createSignal<Point[]>([]);
  const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 });

  // Visualization options
  const [showCircumcircles, setShowCircumcircles] = createSignal(false);
  const [showVoronoi, setShowVoronoi] = createSignal(false);
  const [showPoints, setShowPoints] = createSignal(false);
  const [colorMode, setColorMode] = createSignal('none');

  // Interactive mode
  const [interactivePoints, setInteractivePoints] = createSignal<Point[]>([]);

  const getGenerator = () => {
    switch (selectedGenerator()) {
      case 'grid':
        return new GridPointGenerator();
      case 'circular':
        return new CircularPointGenerator();
      case 'spiral':
        return new SpiralPointGenerator();
      case 'poisson':
        return new PoissonDiskPointGenerator();
      default:
        return new RandomPointGenerator();
    }
  };

  const getGeneratorOptions = () => {
    const count = pointCount();
    switch (selectedGenerator()) {
      case 'grid': {
        const side = Math.ceil(Math.sqrt(count));
        return { rows: side, cols: side, jitter: 0.3 };
      }
      case 'circular': {
        const rings = Math.max(2, Math.floor(Math.sqrt(count / 3)));
        const pointsPerRing = Math.floor(count / (rings * (rings + 1) / 2));
        return { rings, pointsPerRing: Math.max(4, pointsPerRing) };
      }
      case 'spiral':
        return { count, turns: 8 };
      case 'poisson':
        return { count };
      default:
        return { count };
    }
  };

  const generateTriangulation = () => {
    if (!renderer) return;

    const { width, height } = renderer.getDimensions();

    let newPoints: Point[];
    if (selectedGenerator() === 'interactive') {
      newPoints = interactivePoints();
    } else {
      const generator = getGenerator();
      const options = getGeneratorOptions();
      newPoints = generator.generate(width, height, options);
    }

    setPoints(newPoints);

    if (newPoints.length < 3) {
      setTriangles([]);
      return;
    }

    const superTriangle = new Triangle(
      new Point(-width * 2, height * 2),
      new Point(width * 2, height * 2),
      new Point(width / 2, -height * 2)
    );

    const newTriangles = BowyerWatson.triangulate(newPoints, superTriangle);
    setTriangles(newTriangles);
  };

  const getTriangleColor = (triangle: Triangle, index: number) => {
    const mode = colorMode();
    if (mode === 'none') return null;

    if (mode === 'random') {
      const hue = (index * 137.5) % 360;
      return `hsla(${hue}, 70%, 80%, 0.6)`;
    }

    if (mode === 'area') {
      const area = triangle.getArea();
      const maxArea = Math.max(...triangles().map(t => t.getArea()));
      const normalized = area / maxArea;
      const hue = (1 - normalized) * 240; // Blue (small) to Red (large)
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    }

    if (mode === 'aspect') {
      // Calculate aspect ratio (ratio of longest to shortest edge)
      const edges = triangle.getEdges();
      const lengths = edges.map(e => e.getLength());
      const maxLen = Math.max(...lengths);
      const minLen = Math.min(...lengths);
      const aspectRatio = maxLen / minLen;
      // Good triangles have aspect ratio close to 1
      const quality = Math.min(1, 1 / aspectRatio);
      const hue = quality * 120; // Red (bad) to Green (good)
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    }

    return null;
  };

  const computeVoronoiEdges = () => {
    const tris = triangles();
    const voronoiEdges: Edge[] = [];

    // For each triangle, connect its circumcenter to neighbors' circumcenters
    for (let i = 0; i < tris.length; i++) {
      const tri = tris[i];
      const center = tri.getCircumcenter();

      for (const edge of tri.getEdges()) {
        // Find the neighbor triangle that shares this edge
        for (let j = i + 1; j < tris.length; j++) {
          const other = tris[j];
          if (other.hasEdge(edge)) {
            const otherCenter = other.getCircumcenter();
            voronoiEdges.push(new Edge(center, otherCenter));
            break;
          }
        }
      }
    }

    return voronoiEdges;
  };

  const render = () => {
    if (!renderer) return;
    const ctx = (renderer as any).ctx;

    renderer.clear('white');

    // Render triangles with optional coloring
    const tris = triangles();
    for (let i = 0; i < tris.length; i++) {
      const fillColor = getTriangleColor(tris[i], i);
      renderer.renderTriangle(tris[i], {
        fillStyle: fillColor || undefined,
        drawInteriorLines: !fillColor,
      });
    }

    // Render Voronoi diagram
    if (showVoronoi()) {
      const voronoiEdges = computeVoronoiEdges();
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      for (const edge of voronoiEdges) {
        ctx.beginPath();
        ctx.moveTo(edge.p1.x, edge.p1.y);
        ctx.lineTo(edge.p2.x, edge.p2.y);
        ctx.stroke();
      }
    }

    // Render circumcircles
    if (showCircumcircles()) {
      for (const tri of tris) {
        renderer.renderCircumcircle(tri, {
          strokeStyle: 'rgba(52, 152, 219, 0.4)',
          lineWidth: 1,
        });
      }
    }

    // Render points
    if (showPoints()) {
      renderer.renderPoints(points(), {
        fillStyle: '#e74c3c',
        radius: 4,
      });
    }
  };

  const handleResize = () => {
    if (!canvasRef || !renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setup(width, height);
    setDimensions({ width, height });
    if (selectedGenerator() !== 'interactive') {
      generateTriangulation();
    } else {
      render();
    }
  };

  const handleCanvasClick = (e: MouseEvent) => {
    if (selectedGenerator() === 'interactive') {
      const rect = canvasRef!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setInteractivePoints([...interactivePoints(), new Point(x, y)]);
      generateTriangulation();
    } else {
      generateTriangulation();
    }
  };

  const clearInteractivePoints = () => {
    setInteractivePoints([]);
    setPoints([]);
    setTriangles([]);
  };

  // Export functions
  const exportAsSVG = () => {
    const { width, height } = dimensions();
    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`;
    svg += `  <rect width="100%" height="100%" fill="white"/>\n`;

    // Export triangles
    for (let i = 0; i < triangles().length; i++) {
      const tri = triangles()[i];
      const fill = getTriangleColor(tri, i) || 'none';
      svg += `  <polygon points="${tri.a.x},${tri.a.y} ${tri.b.x},${tri.b.y} ${tri.c.x},${tri.c.y}" `;
      svg += `fill="${fill}" stroke="black" stroke-width="1"/>\n`;
    }

    // Export points if visible
    if (showPoints()) {
      for (const p of points()) {
        svg += `  <circle cx="${p.x}" cy="${p.y}" r="4" fill="#e74c3c"/>\n`;
      }
    }

    svg += `</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delaunay-triangulation.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const data = {
      dimensions: dimensions(),
      points: points().map(p => ({ x: p.x, y: p.y })),
      triangles: triangles().map(t => ({
        a: { x: t.a.x, y: t.a.y },
        b: { x: t.b.x, y: t.b.y },
        c: { x: t.c.x, y: t.c.y },
        area: t.getArea(),
        circumcenter: (() => {
          const c = t.getCircumcenter();
          return { x: c.x, y: c.y };
        })(),
        circumradius: t.getCircumradius(),
      })),
      settings: {
        generator: selectedGenerator(),
        pointCount: pointCount(),
        colorMode: colorMode(),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delaunay-triangulation.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveConfiguration = () => {
    const config = {
      generator: selectedGenerator(),
      pointCount: pointCount(),
      colorMode: colorMode(),
      showCircumcircles: showCircumcircles(),
      showVoronoi: showVoronoi(),
      showPoints: showPoints(),
      interactivePoints: interactivePoints().map(p => ({ x: p.x, y: p.y })),
    };
    localStorage.setItem('delaunay-config', JSON.stringify(config));
    alert('Configuration saved!');
  };

  const loadConfiguration = () => {
    const saved = localStorage.getItem('delaunay-config');
    if (saved) {
      const config = JSON.parse(saved);
      setSelectedGenerator(config.generator || 'random');
      setPointCount(config.pointCount || 50);
      setColorMode(config.colorMode || 'none');
      setShowCircumcircles(config.showCircumcircles || false);
      setShowVoronoi(config.showVoronoi || false);
      setShowPoints(config.showPoints || false);
      if (config.interactivePoints) {
        setInteractivePoints(config.interactivePoints.map((p: any) => new Point(p.x, p.y)));
      }
      alert('Configuration loaded!');
    } else {
      alert('No saved configuration found.');
    }
  };

  onMount(() => {
    if (!canvasRef) return;

    renderer = new CanvasRenderer(canvasRef);
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setup(width, height);
    setDimensions({ width, height });

    window.addEventListener('resize', handleResize);

    generateTriangulation();
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
  });

  // Re-render when visualization options change
  createEffect(() => {
    triangles();
    showCircumcircles();
    showVoronoi();
    showPoints();
    colorMode();
    render();
  });

  // Regenerate when generator or count changes (but not for interactive mode on count change)
  createEffect(() => {
    const gen = selectedGenerator();
    const count = pointCount();
    if (renderer && gen !== 'interactive') {
      generateTriangulation();
    }
  });

  return (
    <div class="app">
      <canvas ref={canvasRef} class="canvas" onClick={handleCanvasClick} />

      <div class="controls">
        <h2>Delaunay Triangulation</h2>

        <div class="control-group">
          <label class="control-label">Point Generator</label>
          <Select<GeneratorOption>
            value={generatorOptions.find((opt) => opt.value === selectedGenerator())}
            onChange={(option) => {
              if (option) {
                setSelectedGenerator(option.value);
                if (option.value === 'interactive') {
                  clearInteractivePoints();
                }
              }
            }}
            options={generatorOptions}
            optionValue="value"
            optionTextValue="label"
            placeholder="Select generator..."
            itemComponent={(props) => (
              <Select.Item item={props.item} class="select__item">
                <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
                <Select.ItemIndicator class="select__item-indicator">
                  ✓
                </Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Trigger class="select__trigger" aria-label="Generator">
              <Select.Value<GeneratorOption>>
                {(state) => state.selectedOption()?.label}
              </Select.Value>
              <Select.Icon class="select__icon">▼</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="select__content">
                <Select.Listbox class="select__listbox" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>

        <Show when={selectedGenerator() !== 'interactive'}>
          <div class="control-group">
            <label class="control-label">Point Count: {pointCount()}</label>
            <Slider
              value={[pointCount()]}
              onChange={(values) => setPointCount(values[0])}
              minValue={10}
              maxValue={200}
              step={5}
              class="slider"
            >
              <Slider.Track class="slider__track">
                <Slider.Fill class="slider__fill" />
                <Slider.Thumb class="slider__thumb">
                  <Slider.Input />
                </Slider.Thumb>
              </Slider.Track>
            </Slider>
          </div>
        </Show>

        <Show when={selectedGenerator() === 'interactive'}>
          <div class="control-group">
            <button class="secondary-btn" onClick={clearInteractivePoints}>
              Clear Points
            </button>
          </div>
        </Show>

        <div class="control-group">
          <label class="control-label">Triangle Coloring</label>
          <Select<ColorModeOption>
            value={colorModeOptions.find((opt) => opt.value === colorMode())}
            onChange={(option) => option && setColorMode(option.value)}
            options={colorModeOptions}
            optionValue="value"
            optionTextValue="label"
            placeholder="Select color mode..."
            itemComponent={(props) => (
              <Select.Item item={props.item} class="select__item">
                <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
                <Select.ItemIndicator class="select__item-indicator">
                  ✓
                </Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Trigger class="select__trigger" aria-label="Color Mode">
              <Select.Value<ColorModeOption>>
                {(state) => state.selectedOption()?.label}
              </Select.Value>
              <Select.Icon class="select__icon">▼</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="select__content">
                <Select.Listbox class="select__listbox" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>

        <div class="control-group checkboxes">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={showCircumcircles()}
              onChange={(e) => setShowCircumcircles(e.currentTarget.checked)}
            />
            Show Circumcircles
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={showVoronoi()}
              onChange={(e) => setShowVoronoi(e.currentTarget.checked)}
            />
            Show Voronoi Diagram
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={showPoints()}
              onChange={(e) => setShowPoints(e.currentTarget.checked)}
            />
            Show Points
          </label>
        </div>

        <div class="control-group">
          <button class="regenerate-btn" onClick={generateTriangulation}>
            Regenerate
          </button>
        </div>

        <div class="control-group export-buttons">
          <button class="export-btn" onClick={exportAsSVG}>
            Export SVG
          </button>
          <button class="export-btn" onClick={exportAsJSON}>
            Export JSON
          </button>
        </div>

        <div class="control-group config-buttons">
          <button class="config-btn" onClick={saveConfiguration}>
            Save Config
          </button>
          <button class="config-btn" onClick={loadConfiguration}>
            Load Config
          </button>
        </div>

        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">Points:</span>
            <span class="stat-value">{points().length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Triangles:</span>
            <span class="stat-value">{triangles().length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Canvas:</span>
            <span class="stat-value">
              {dimensions().width} × {dimensions().height}
            </span>
          </div>
        </div>
      </div>

      <div class="instructions">
        {selectedGenerator() === 'interactive'
          ? 'Click to place points (minimum 3 required)'
          : 'Click anywhere to regenerate'}
      </div>
    </div>
  );
}

export default App;
