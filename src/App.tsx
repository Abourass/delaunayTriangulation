import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { Select } from '@kobalte/core/select';
import { Slider } from '@kobalte/core/slider';
import { Point, Triangle } from './core/index.mjs';
import { BowyerWatson } from './algorithms/BowyerWatson.mjs';
import { CanvasRenderer } from './rendering/CanvasRenderer.mjs';
import {
  RandomPointGenerator,
  GridPointGenerator,
  CircularPointGenerator,
} from './generators/PointGenerator.mjs';

interface GeneratorOption {
  value: string;
  label: string;
  description: string;
}

const generatorOptions: GeneratorOption[] = [
  { value: 'random', label: 'Random', description: 'Uniformly distributed random points' },
  { value: 'grid', label: 'Grid', description: 'Points arranged in a grid pattern' },
  { value: 'circular', label: 'Circular', description: 'Points in concentric circles' },
];

function App() {
  let canvasRef: HTMLCanvasElement | undefined;
  let renderer: CanvasRenderer | undefined;

  const [selectedGenerator, setSelectedGenerator] = createSignal('random');
  const [pointCount, setPointCount] = createSignal(50);
  const [triangles, setTriangles] = createSignal<Triangle[]>([]);
  const [points, setPoints] = createSignal<Point[]>([]);
  const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 });

  const getGenerator = () => {
    switch (selectedGenerator()) {
      case 'grid':
        return new GridPointGenerator();
      case 'circular':
        return new CircularPointGenerator();
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
      default:
        return { count };
    }
  };

  const generateTriangulation = () => {
    if (!renderer) return;

    const { width, height } = renderer.getDimensions();
    const generator = getGenerator();
    const options = getGeneratorOptions();

    const newPoints = generator.generate(width, height, options);
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

  const render = () => {
    if (!renderer) return;
    renderer.clear('white');
    renderer.renderTriangles(triangles());
  };

  const handleResize = () => {
    if (!canvasRef || !renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setup(width, height);
    setDimensions({ width, height });
    generateTriangulation();
  };

  const handleCanvasClick = () => {
    generateTriangulation();
  };

  onMount(() => {
    if (!canvasRef) return;

    renderer = new CanvasRenderer(canvasRef);
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setup(width, height);
    setDimensions({ width, height });

    window.addEventListener('resize', handleResize);
    canvasRef.addEventListener('click', handleCanvasClick);

    generateTriangulation();
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
    if (canvasRef) {
      canvasRef.removeEventListener('click', handleCanvasClick);
    }
  });

  // Re-render when triangles change
  createEffect(() => {
    triangles(); // track dependency
    render();
  });

  // Regenerate when generator or count changes
  createEffect(() => {
    selectedGenerator(); // track dependency
    pointCount(); // track dependency
    if (renderer) {
      generateTriangulation();
    }
  });

  return (
    <div class="app">
      <canvas ref={canvasRef} class="canvas" />

      <div class="controls">
        <h2>Delaunay Triangulation</h2>

        <div class="control-group">
          <label class="control-label">Point Generator</label>
          <Select<GeneratorOption>
            value={generatorOptions.find((opt) => opt.value === selectedGenerator())}
            onChange={(option) => option && setSelectedGenerator(option.value)}
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

        <div class="control-group">
          <button class="regenerate-btn" onClick={generateTriangulation}>
            Regenerate
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

      <div class="instructions">Click anywhere to regenerate</div>
    </div>
  );
}

export default App;
