import { createSignal, createEffect, onMount, onCleanup, Show, batch } from 'solid-js';
import { Select } from '@kobalte/core/select';
import { Slider } from '@kobalte/core/slider';
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

interface AnimationModeOption {
  value: string;
  label: string;
  description: string;
}

interface PointTrail {
  point: Point;
  trail: { x: number; y: number; age: number }[];
  velocity: { x: number; y: number };
}

interface AlgorithmStep {
  type: 'add_point' | 'find_bad' | 'find_boundary' | 'remove_bad' | 'retriangulate' | 'cleanup';
  description: string;
  triangulation: Triangle[];
  badTriangles?: Triangle[];
  boundaryPolygon?: Edge[];
  currentPoint?: Point;
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

const animationModeOptions: AnimationModeOption[] = [
  { value: 'none', label: 'None', description: 'No animation' },
  { value: 'colorFlow', label: 'Color Flow', description: 'Colors cascade through triangle adjacency' },
  { value: 'particleTrails', label: 'Particle Trails', description: 'Points move with trailing history' },
  { value: 'kaleidoscope', label: 'Kaleidoscope', description: 'Mirror/rotate for symmetric patterns' },
  { value: 'psychedelic', label: 'Psychedelic', description: 'Colorful rotating kaleidoscope' },
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
  const [lineWidth, setLineWidth] = createSignal(2);
  const [strokeColor, setStrokeColor] = createSignal('#000000');
  const [backgroundColor, setBackgroundColor] = createSignal('#ffffff');

  // Zoom and pan
  const [zoom, setZoom] = createSignal(1);
  const [panOffset, setPanOffset] = createSignal({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = createSignal(false);
  const [lastMousePos, setLastMousePos] = createSignal({ x: 0, y: 0 });

  // Interactive and tutorial modes
  const [interactivePoints, setInteractivePoints] = createSignal<Point[]>([]);
  const [tutorialMode, setTutorialMode] = createSignal(false);
  const [algorithmSteps, setAlgorithmSteps] = createSignal<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [playSpeed, setPlaySpeed] = createSignal(1000);

  // Animation modes
  const [animationMode, setAnimationMode] = createSignal('none');
  const [animationRunning, setAnimationRunning] = createSignal(false);
  const [colorFlowState, setColorFlowState] = createSignal<Map<number, { hue: number; saturation: number; lightness: number }>>(new Map());
  const [colorFlowWave, setColorFlowWave] = createSignal(0);
  const [particleTrails, setParticleTrails] = createSignal<PointTrail[]>([]);
  const [kaleidoscopeFolds, setKaleidoscopeFolds] = createSignal(6);
  const [kaleidoscopeRotation, setKaleidoscopeRotation] = createSignal(0);
  const [animationFrameId, setAnimationFrameId] = createSignal<number | null>(null);

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

  // Generate algorithm steps for tutorial mode
  const generateAlgorithmSteps = (pointList: Point[], superTriangle: Triangle): AlgorithmStep[] => {
    const steps: AlgorithmStep[] = [];
    let triangulation = [superTriangle];

    steps.push({
      type: 'add_point',
      description: 'Starting with super triangle that contains all points',
      triangulation: [...triangulation],
    });

    for (let i = 0; i < pointList.length; i++) {
      const point = pointList[i];

      // Find bad triangles
      const badTriangles = triangulation.filter(t => t.containsPointInCircumcircle(point));
      steps.push({
        type: 'find_bad',
        description: `Point ${i + 1}: Found ${badTriangles.length} triangles whose circumcircle contains the point`,
        triangulation: [...triangulation],
        badTriangles: [...badTriangles],
        currentPoint: point,
      });

      // Find boundary polygon
      const polygon: Edge[] = [];
      for (const triangle of badTriangles) {
        for (const edge of triangle.getEdges()) {
          const isShared = badTriangles.some(other => other !== triangle && other.hasEdge(edge));
          if (!isShared) {
            polygon.push(edge);
          }
        }
      }

      steps.push({
        type: 'find_boundary',
        description: `Found boundary polygon with ${polygon.length} edges`,
        triangulation: [...triangulation],
        badTriangles: [...badTriangles],
        boundaryPolygon: [...polygon],
        currentPoint: point,
      });

      // Remove bad triangles
      for (const triangle of badTriangles) {
        const index = triangulation.indexOf(triangle);
        if (index > -1) {
          triangulation.splice(index, 1);
        }
      }

      steps.push({
        type: 'remove_bad',
        description: 'Removed bad triangles from triangulation',
        triangulation: [...triangulation],
        boundaryPolygon: [...polygon],
        currentPoint: point,
      });

      // Retriangulate
      for (const edge of polygon) {
        triangulation.push(new Triangle(edge.p1, edge.p2, point));
      }

      steps.push({
        type: 'retriangulate',
        description: `Created ${polygon.length} new triangles connecting to the point`,
        triangulation: [...triangulation],
        currentPoint: point,
      });
    }

    // Cleanup: remove triangles sharing vertices with super triangle
    let i = triangulation.length;
    while (i--) {
      if (triangulation[i].sharesVertexWith(superTriangle)) {
        triangulation.splice(i, 1);
      }
    }

    steps.push({
      type: 'cleanup',
      description: 'Removed triangles connected to super triangle',
      triangulation: [...triangulation],
    });

    return steps;
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
      setAlgorithmSteps([]);
      return;
    }

    const superTriangle = new Triangle(
      new Point(-width * 2, height * 2),
      new Point(width * 2, height * 2),
      new Point(width / 2, -height * 2)
    );

    if (tutorialMode()) {
      const steps = generateAlgorithmSteps(newPoints, superTriangle);
      setAlgorithmSteps(steps);
      setCurrentStep(0);
      setTriangles(steps[0].triangulation);
    } else {
      const newTriangles = BowyerWatson.triangulate(newPoints, superTriangle);
      setTriangles(newTriangles);
      setAlgorithmSteps([]);
    }
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
      const hue = (1 - normalized) * 240;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    }

    if (mode === 'aspect') {
      const edges = triangle.getEdges();
      const lengths = edges.map(e => e.getLength());
      const maxLen = Math.max(...lengths);
      const minLen = Math.min(...lengths);
      const aspectRatio = maxLen / minLen;
      const quality = Math.min(1, 1 / aspectRatio);
      const hue = quality * 120;
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    }

    return null;
  };

  const computeVoronoiEdges = () => {
    const tris = triangles();
    const voronoiEdges: Edge[] = [];

    for (let i = 0; i < tris.length; i++) {
      const tri = tris[i];
      const center = tri.getCircumcenter();

      for (const edge of tri.getEdges()) {
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
    const canvas = (renderer as any).canvas;

    ctx.save();

    // Clear with background color
    ctx.fillStyle = backgroundColor();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.translate(panOffset().x, panOffset().y);
    ctx.scale(zoom(), zoom());

    const currentStepData = algorithmSteps()[currentStep()];

    // Render triangles
    const tris = triangles();
    for (let i = 0; i < tris.length; i++) {
      const tri = tris[i];
      const fillColor = getTriangleColor(tri, i);
      const isBad = currentStepData?.badTriangles?.some(
        (bt: Triangle) => bt === tri || (bt.a.equals(tri.a) && bt.b.equals(tri.b) && bt.c.equals(tri.c))
      );

      ctx.strokeStyle = isBad ? '#e74c3c' : strokeColor();
      ctx.lineWidth = isBad ? lineWidth() * 2 : lineWidth();
      ctx.beginPath();
      ctx.moveTo(tri.a.x, tri.a.y);
      ctx.lineTo(tri.b.x, tri.b.y);
      ctx.lineTo(tri.c.x, tri.c.y);
      ctx.closePath();

      if (isBad) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.fill();
      } else if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }

      ctx.stroke();

      // Draw interior lines if no fill
      if (!fillColor && !isBad && colorMode() === 'none') {
        const lineCount = Math.round(Math.random() * 9 + 2);
        const delta1 = tri.a.sub(tri.c).div(lineCount + 1);
        const delta2 = tri.b.sub(tri.c).div(lineCount + 1);
        for (let j = 1; j <= lineCount; j++) {
          const p1 = tri.c.add(delta1.mult(j));
          const p2 = tri.c.add(delta2.mult(j));
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // Render boundary polygon in tutorial mode
    if (currentStepData?.boundaryPolygon) {
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = lineWidth() * 3;
      ctx.setLineDash([10, 5]);
      for (const edge of currentStepData.boundaryPolygon) {
        ctx.beginPath();
        ctx.moveTo(edge.p1.x, edge.p1.y);
        ctx.lineTo(edge.p2.x, edge.p2.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
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
        const center = tri.getCircumcenter();
        const radius = tri.getCircumradius();
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Render points
    if (showPoints()) {
      for (const p of points()) {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render current point in tutorial mode
    if (currentStepData?.currentPoint) {
      const p = currentStepData.currentPoint;
      ctx.fillStyle = '#27ae60';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  };

  // Build triangle adjacency graph for color flow
  const buildAdjacencyGraph = (tris: Triangle[]): Map<number, number[]> => {
    const adjacency = new Map<number, number[]>();

    for (let i = 0; i < tris.length; i++) {
      adjacency.set(i, []);
    }

    for (let i = 0; i < tris.length; i++) {
      for (let j = i + 1; j < tris.length; j++) {
        // Check if triangles share an edge
        const edges1 = tris[i].getEdges();
        const edges2 = tris[j].getEdges();

        let shared = false;
        for (const e1 of edges1) {
          for (const e2 of edges2) {
            if (e1.equals(e2)) {
              shared = true;
              break;
            }
          }
          if (shared) break;
        }

        if (shared) {
          adjacency.get(i)!.push(j);
          adjacency.get(j)!.push(i);
        }
      }
    }

    return adjacency;
  };

  // Initialize color flow animation
  const initColorFlow = () => {
    const tris = triangles();
    if (tris.length === 0) return;

    const colors = new Map<number, { hue: number; saturation: number; lightness: number }>();

    // Initialize with gradient based on position
    for (let i = 0; i < tris.length; i++) {
      const centroid = tris[i].getCentroid();
      const hue = (centroid.x / dimensions().width) * 360;
      colors.set(i, { hue, saturation: 70, lightness: 50 });
    }

    setColorFlowState(colors);
    setColorFlowWave(0);
  };

  // Update color flow animation
  const updateColorFlow = () => {
    const tris = triangles();
    if (tris.length === 0) return;

    const adjacency = buildAdjacencyGraph(tris);
    const colors = new Map(colorFlowState());
    const wave = colorFlowWave();

    // Propagate colors through adjacency with wave effect
    const newColors = new Map<number, { hue: number; saturation: number; lightness: number }>();

    for (let i = 0; i < tris.length; i++) {
      const centroid = tris[i].getCentroid();
      const distFromCenter = Math.sqrt(
        Math.pow(centroid.x - dimensions().width / 2, 2) +
        Math.pow(centroid.y - dimensions().height / 2, 2)
      );

      // Wave emanating from center
      const wavePhase = (distFromCenter / 50 - wave) % 360;
      const hue = (wavePhase + 360) % 360;

      // Get average of neighbors for smoothing
      const neighbors = adjacency.get(i) || [];
      let avgHue = hue;
      if (neighbors.length > 0 && colors.size > 0) {
        let sumHue = hue;
        for (const n of neighbors) {
          const nc = colors.get(n);
          if (nc) sumHue += nc.hue;
        }
        avgHue = sumHue / (neighbors.length + 1);
      }

      newColors.set(i, {
        hue: avgHue,
        saturation: 70 + Math.sin(wave * 0.1) * 20,
        lightness: 50 + Math.cos(distFromCenter * 0.01 + wave * 0.05) * 15,
      });
    }

    setColorFlowState(newColors);
    setColorFlowWave(wave + 2);
  };

  // Initialize particle trails
  const initParticleTrails = () => {
    let currentPoints = points();

    // If no points, generate some
    if (currentPoints.length < 3) {
      const { width, height } = dimensions();
      const generator = getGenerator();
      currentPoints = generator.generate(width, height, { count: pointCount() });
      const newTriangles = BowyerWatson.triangulate(currentPoints, width, height);
      setPoints(currentPoints);
      setTriangles(newTriangles);
    }

    const trails: PointTrail[] = currentPoints.map((p) => ({
      point: new Point(p.x, p.y),
      trail: [{ x: p.x, y: p.y, age: 0 }],
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
      },
    }));
    setParticleTrails(trails);
  };

  // Update particle trails
  const updateParticleTrails = () => {
    const { width, height } = dimensions();
    const currentTrails = particleTrails();

    if (currentTrails.length === 0) {
      initParticleTrails();
      return;
    }

    const trails = currentTrails.map((pt) => {
      // Update position with velocity
      let newX = pt.point.x + pt.velocity.x;
      let newY = pt.point.y + pt.velocity.y;
      let newVx = pt.velocity.x;
      let newVy = pt.velocity.y;

      // Bounce off walls
      if (newX <= 0 || newX >= width) {
        newVx = -newVx * 0.95;
        newX = Math.max(1, Math.min(width - 1, newX));
      }
      if (newY <= 0 || newY >= height) {
        newVy = -newVy * 0.95;
        newY = Math.max(1, Math.min(height - 1, newY));
      }

      // Add slight random perturbation
      newVx += (Math.random() - 0.5) * 0.3;
      newVy += (Math.random() - 0.5) * 0.3;

      // Limit velocity
      const speed = Math.sqrt(newVx * newVx + newVy * newVy);
      if (speed > 5) {
        newVx = (newVx / speed) * 5;
        newVy = (newVy / speed) * 5;
      }

      // Update trail (keep last 30 positions)
      const newTrail = [
        { x: newX, y: newY, age: 0 },
        ...pt.trail.map((t) => ({ ...t, age: t.age + 1 })).slice(0, 29),
      ];

      return {
        point: new Point(newX, newY),
        trail: newTrail,
        velocity: { x: newVx, y: newVy },
      };
    });

    setParticleTrails(trails);

    // Retriangulate with new positions
    const newPoints = trails.map((t) => t.point);
    if (newPoints.length >= 3) {
      const { width, height } = dimensions();
      const newTriangles = BowyerWatson.triangulate(newPoints, width, height);
      setPoints(newPoints);
      setTriangles(newTriangles);
    }
  };

  // Render with animations
  const renderWithAnimation = () => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = backgroundColor();
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset().x, panOffset().y);
    ctx.scale(zoom(), zoom());

    const mode = animationMode();
    const tris = triangles();

    if (mode === 'kaleidoscope') {
      // Render kaleidoscope effect
      const folds = kaleidoscopeFolds();
      const rotation = kaleidoscopeRotation();
      const centerX = width / 2;
      const centerY = height / 2;

      for (let fold = 0; fold < folds; fold++) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((fold * Math.PI * 2) / folds + rotation);

        // Mirror every other fold
        if (fold % 2 === 1) {
          ctx.scale(-1, 1);
        }

        ctx.translate(-centerX, -centerY);

        // Draw triangles
        for (let i = 0; i < tris.length; i++) {
          const tri = tris[i];
          const fill = getTriangleColor(tri, i);

          ctx.beginPath();
          ctx.moveTo(tri.a.x, tri.a.y);
          ctx.lineTo(tri.b.x, tri.b.y);
          ctx.lineTo(tri.c.x, tri.c.y);
          ctx.closePath();

          if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
          }
          ctx.strokeStyle = strokeColor();
          ctx.lineWidth = lineWidth();
          ctx.stroke();
        }

        ctx.restore();
      }

      setKaleidoscopeRotation(rotation + 0.005);
    } else if (mode === 'colorFlow') {
      // Render with flowing colors
      const colors = colorFlowState();

      for (let i = 0; i < tris.length; i++) {
        const tri = tris[i];
        const color = colors.get(i);

        ctx.beginPath();
        ctx.moveTo(tri.a.x, tri.a.y);
        ctx.lineTo(tri.b.x, tri.b.y);
        ctx.lineTo(tri.c.x, tri.c.y);
        ctx.closePath();

        if (color) {
          ctx.fillStyle = `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
          ctx.fill();
        }
        ctx.strokeStyle = strokeColor();
        ctx.lineWidth = lineWidth();
        ctx.stroke();
      }

      updateColorFlow();
    } else if (mode === 'particleTrails') {
      // Render particle trails
      const trails = particleTrails();

      // Draw triangles first
      for (let i = 0; i < tris.length; i++) {
        const tri = tris[i];
        const fill = getTriangleColor(tri, i);

        ctx.beginPath();
        ctx.moveTo(tri.a.x, tri.a.y);
        ctx.lineTo(tri.b.x, tri.b.y);
        ctx.lineTo(tri.c.x, tri.c.y);
        ctx.closePath();

        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.strokeStyle = strokeColor();
        ctx.lineWidth = lineWidth();
        ctx.stroke();
      }

      // Draw trails
      for (let i = 0; i < trails.length; i++) {
        const pt = trails[i];
        const hue = (i / trails.length) * 360;

        // Draw trail line
        if (pt.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(pt.trail[0].x, pt.trail[0].y);

          for (let j = 1; j < pt.trail.length; j++) {
            const t = pt.trail[j];
            ctx.lineTo(t.x, t.y);
          }

          ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.6)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw current point
        ctx.fillStyle = `hsl(${hue}, 90%, 50%)`;
        ctx.beginPath();
        ctx.arc(pt.point.x, pt.point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      updateParticleTrails();
    } else if (mode === 'psychedelic') {
      // Render psychedelic kaleidoscope with shifting colors
      const folds = kaleidoscopeFolds();
      const rotation = kaleidoscopeRotation();
      const centerX = width / 2;
      const centerY = height / 2;
      const time = rotation * 50; // Use rotation as time base

      for (let fold = 0; fold < folds; fold++) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((fold * Math.PI * 2) / folds + rotation);

        // Mirror every other fold
        if (fold % 2 === 1) {
          ctx.scale(-1, 1);
        }

        ctx.translate(-centerX, -centerY);

        // Draw triangles with psychedelic colors
        for (let i = 0; i < tris.length; i++) {
          const tri = tris[i];
          const centroid = tri.getCentroid();

          // Calculate psychedelic color based on position and time
          const distFromCenter = Math.sqrt(
            Math.pow(centroid.x - centerX, 2) + Math.pow(centroid.y - centerY, 2)
          );
          const angle = Math.atan2(centroid.y - centerY, centroid.x - centerX);

          // Create shifting rainbow effect
          const hue = (angle * 180 / Math.PI + time + distFromCenter * 0.5 + fold * 30) % 360;
          const saturation = 80 + Math.sin(time * 0.05 + i * 0.1) * 20;
          const lightness = 50 + Math.cos(distFromCenter * 0.02 + time * 0.03) * 20;

          ctx.beginPath();
          ctx.moveTo(tri.a.x, tri.a.y);
          ctx.lineTo(tri.b.x, tri.b.y);
          ctx.lineTo(tri.c.x, tri.c.y);
          ctx.closePath();

          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          ctx.fill();

          // Use complementary color for stroke for extra psychedelic effect
          ctx.strokeStyle = `hsl(${(hue + 180) % 360}, 60%, 30%)`;
          ctx.lineWidth = lineWidth() * 0.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      setKaleidoscopeRotation(rotation + 0.008);
    }

    ctx.restore();
  };

  // Animation loop
  const startAnimation = () => {
    if (animationRunning()) return;

    setAnimationRunning(true);

    const mode = animationMode();
    if (mode === 'colorFlow') {
      initColorFlow();
    } else if (mode === 'particleTrails') {
      initParticleTrails();
    } else if (mode === 'kaleidoscope' || mode === 'psychedelic') {
      setKaleidoscopeRotation(0);
    }

    const animate = () => {
      if (!animationRunning()) return;

      renderWithAnimation();
      const id = requestAnimationFrame(animate);
      setAnimationFrameId(id);
    };

    animate();
  };

  const stopAnimation = () => {
    setAnimationRunning(false);
    const id = animationFrameId();
    if (id !== null) {
      cancelAnimationFrame(id);
      setAnimationFrameId(null);
    }
    render(); // Render static version
  };

  // Tutorial controls
  const stepForward = () => {
    const steps = algorithmSteps();
    if (currentStep() < steps.length - 1) {
      const nextStep = currentStep() + 1;
      setCurrentStep(nextStep);
      setTriangles(steps[nextStep].triangulation);
    }
  };

  const stepBackward = () => {
    if (currentStep() > 0) {
      const prevStep = currentStep() - 1;
      setCurrentStep(prevStep);
      setTriangles(algorithmSteps()[prevStep].triangulation);
    }
  };

  const playTutorial = () => {
    setIsPlaying(true);
  };

  const pauseTutorial = () => {
    setIsPlaying(false);
  };

  const resetTutorial = () => {
    setCurrentStep(0);
    if (algorithmSteps().length > 0) {
      setTriangles(algorithmSteps()[0].triangulation);
    }
    setIsPlaying(false);
  };

  // Auto-play tutorial
  createEffect(() => {
    if (isPlaying() && algorithmSteps().length > 0) {
      const timer = setInterval(() => {
        if (currentStep() < algorithmSteps().length - 1) {
          stepForward();
        } else {
          setIsPlaying(false);
        }
      }, playSpeed());

      onCleanup(() => clearInterval(timer));
    }
  });

  const handleResize = () => {
    if (!canvasRef || !renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setup(width, height);
    setDimensions({ width, height });
    if (selectedGenerator() !== 'interactive' && !tutorialMode()) {
      generateTriangulation();
    } else {
      render();
    }
  };

  const handleCanvasClick = (e: MouseEvent) => {
    if (isPanning()) return;

    if (selectedGenerator() === 'interactive') {
      const rect = canvasRef!.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset().x) / zoom();
      const y = (e.clientY - rect.top - panOffset().y) / zoom();
      setInteractivePoints([...interactivePoints(), new Point(x, y)]);
      generateTriangulation();
    } else if (!tutorialMode()) {
      generateTriangulation();
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoom() * delta));
    setZoom(newZoom);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning()) {
      const dx = e.clientX - lastMousePos().x;
      const dy = e.clientY - lastMousePos().y;
      setPanOffset({ x: panOffset().x + dx, y: panOffset().y + dy });
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetZoomPan = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
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
    svg += `  <rect width="100%" height="100%" fill="${backgroundColor()}"/>\n`;

    for (let i = 0; i < triangles().length; i++) {
      const tri = triangles()[i];
      const fill = getTriangleColor(tri, i) || 'none';
      svg += `  <polygon points="${tri.a.x},${tri.a.y} ${tri.b.x},${tri.b.y} ${tri.c.x},${tri.c.y}" `;
      svg += `fill="${fill}" stroke="${strokeColor()}" stroke-width="${lineWidth()}"/>\n`;
    }

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
        lineWidth: lineWidth(),
        strokeColor: strokeColor(),
        backgroundColor: backgroundColor(),
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
      lineWidth: lineWidth(),
      strokeColor: strokeColor(),
      backgroundColor: backgroundColor(),
      interactivePoints: interactivePoints().map(p => ({ x: p.x, y: p.y })),
    };
    localStorage.setItem('delaunay-config', JSON.stringify(config));
    alert('Configuration saved!');
  };

  const loadConfiguration = () => {
    const saved = localStorage.getItem('delaunay-config');
    if (saved) {
      const config = JSON.parse(saved);
      batch(() => {
        setSelectedGenerator(config.generator || 'random');
        setPointCount(config.pointCount || 50);
        setColorMode(config.colorMode || 'none');
        setShowCircumcircles(config.showCircumcircles || false);
        setShowVoronoi(config.showVoronoi || false);
        setShowPoints(config.showPoints || false);
        setLineWidth(config.lineWidth || 2);
        setStrokeColor(config.strokeColor || '#000000');
        setBackgroundColor(config.backgroundColor || '#ffffff');
        if (config.interactivePoints) {
          setInteractivePoints(config.interactivePoints.map((p: any) => new Point(p.x, p.y)));
        }
      });
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
    canvasRef.addEventListener('wheel', handleWheel, { passive: false });
    canvasRef.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    generateTriangulation();
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  });

  // Re-render when visualization options change
  createEffect(() => {
    triangles();
    showCircumcircles();
    showVoronoi();
    showPoints();
    colorMode();
    lineWidth();
    strokeColor();
    backgroundColor();
    zoom();
    panOffset();
    currentStep();
    render();
  });

  // Regenerate when generator or count changes
  createEffect(() => {
    const gen = selectedGenerator();
    pointCount();
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
                <Select.ItemIndicator class="select__item-indicator">✓</Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Trigger class="select__trigger" aria-label="Generator">
              <Select.Value<GeneratorOption>>{(state) => state.selectedOption()?.label}</Select.Value>
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
            <Slider value={[pointCount()]} onChange={(v) => setPointCount(v[0])} minValue={10} maxValue={200} step={5} class="slider">
              <Slider.Track class="slider__track">
                <Slider.Fill class="slider__fill" />
                <Slider.Thumb class="slider__thumb"><Slider.Input /></Slider.Thumb>
              </Slider.Track>
            </Slider>
          </div>
        </Show>

        <Show when={selectedGenerator() === 'interactive'}>
          <div class="control-group">
            <button class="secondary-btn" onClick={clearInteractivePoints}>Clear Points</button>
          </div>
        </Show>

        <div class="control-group">
          <label class="control-label">Line Width: {lineWidth()}px</label>
          <Slider value={[lineWidth()]} onChange={(v) => setLineWidth(v[0])} minValue={1} maxValue={10} step={0.5} class="slider">
            <Slider.Track class="slider__track">
              <Slider.Fill class="slider__fill" />
              <Slider.Thumb class="slider__thumb"><Slider.Input /></Slider.Thumb>
            </Slider.Track>
          </Slider>
        </div>

        <div class="control-group color-pickers">
          <div class="color-picker-item">
            <label class="control-label">Stroke</label>
            <input type="color" value={strokeColor()} onInput={(e) => setStrokeColor(e.currentTarget.value)} />
          </div>
          <div class="color-picker-item">
            <label class="control-label">Background</label>
            <input type="color" value={backgroundColor()} onInput={(e) => setBackgroundColor(e.currentTarget.value)} />
          </div>
        </div>

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
                <Select.ItemIndicator class="select__item-indicator">✓</Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Trigger class="select__trigger" aria-label="Color Mode">
              <Select.Value<ColorModeOption>>{(state) => state.selectedOption()?.label}</Select.Value>
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
            <input type="checkbox" checked={showCircumcircles()} onChange={(e) => setShowCircumcircles(e.currentTarget.checked)} />
            Show Circumcircles
          </label>
          <label class="checkbox-label">
            <input type="checkbox" checked={showVoronoi()} onChange={(e) => setShowVoronoi(e.currentTarget.checked)} />
            Show Voronoi Diagram
          </label>
          <label class="checkbox-label">
            <input type="checkbox" checked={showPoints()} onChange={(e) => setShowPoints(e.currentTarget.checked)} />
            Show Points
          </label>
          <label class="checkbox-label">
            <input type="checkbox" checked={tutorialMode()} onChange={(e) => { setTutorialMode(e.currentTarget.checked); generateTriangulation(); }} />
            Tutorial Mode
          </label>
        </div>

        <Show when={tutorialMode() && algorithmSteps().length > 0}>
          <div class="tutorial-panel">
            <div class="tutorial-info">
              Step {currentStep() + 1} / {algorithmSteps().length}
            </div>
            <div class="tutorial-description">
              {algorithmSteps()[currentStep()]?.description}
            </div>
            <div class="tutorial-controls">
              <button class="tutorial-btn" onClick={resetTutorial}>⏮</button>
              <button class="tutorial-btn" onClick={stepBackward} disabled={currentStep() === 0}>◀</button>
              <Show when={!isPlaying()} fallback={<button class="tutorial-btn" onClick={pauseTutorial}>⏸</button>}>
                <button class="tutorial-btn" onClick={playTutorial}>▶</button>
              </Show>
              <button class="tutorial-btn" onClick={stepForward} disabled={currentStep() >= algorithmSteps().length - 1}>▶</button>
            </div>
            <div class="control-group">
              <label class="control-label">Speed: {playSpeed()}ms</label>
              <Slider value={[playSpeed()]} onChange={(v) => setPlaySpeed(v[0])} minValue={100} maxValue={3000} step={100} class="slider">
                <Slider.Track class="slider__track">
                  <Slider.Fill class="slider__fill" />
                  <Slider.Thumb class="slider__thumb"><Slider.Input /></Slider.Thumb>
                </Slider.Track>
              </Slider>
            </div>
          </div>
        </Show>

        <div class="separator" />

        <div class="control-group">
          <label class="control-label">Animation Mode</label>
          <Select<AnimationModeOption>
            value={animationModeOptions.find((opt) => opt.value === animationMode())}
            onChange={(option) => {
              if (option) {
                stopAnimation();
                setAnimationMode(option.value);
              }
            }}
            options={animationModeOptions}
            optionValue="value"
            optionTextValue="label"
            placeholder="Select animation..."
            itemComponent={(props) => (
              <Select.Item item={props.item} class="select__item">
                <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
                <Select.ItemIndicator class="select__item-indicator">✓</Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Trigger class="select__trigger" aria-label="Animation Mode">
              <Select.Value<AnimationModeOption>>{(state) => state.selectedOption()?.label}</Select.Value>
              <Select.Icon class="select__icon">▼</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="select__content">
                <Select.Listbox class="select__listbox" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>

        <Show when={animationMode() !== 'none'}>
          <div class="animation-controls">
            <div class="animation-buttons">
              <Show when={!animationRunning()} fallback={
                <button class="animation-btn stop" onClick={stopAnimation}>Stop Animation</button>
              }>
                <button class="animation-btn start" onClick={startAnimation}>Start Animation</button>
              </Show>
            </div>

            <Show when={animationMode() === 'kaleidoscope' || animationMode() === 'psychedelic'}>
              <div class="control-group">
                <label class="control-label">Folds: {kaleidoscopeFolds()}</label>
                <Slider value={[kaleidoscopeFolds()]} onChange={(v) => setKaleidoscopeFolds(v[0])} minValue={2} maxValue={12} step={1} class="slider">
                  <Slider.Track class="slider__track">
                    <Slider.Fill class="slider__fill" />
                    <Slider.Thumb class="slider__thumb"><Slider.Input /></Slider.Thumb>
                  </Slider.Track>
                </Slider>
              </div>
            </Show>
          </div>
        </Show>

        <div class="separator" />

        <div class="control-group zoom-controls">
          <label class="control-label">Zoom: {(zoom() * 100).toFixed(0)}%</label>
          <div class="zoom-buttons">
            <button class="zoom-btn" onClick={() => setZoom(Math.min(10, zoom() * 1.2))}>+</button>
            <button class="zoom-btn" onClick={() => setZoom(Math.max(0.1, zoom() / 1.2))}>-</button>
            <button class="zoom-btn" onClick={resetZoomPan}>Reset</button>
          </div>
        </div>

        <div class="control-group">
          <button class="regenerate-btn" onClick={generateTriangulation}>Regenerate</button>
        </div>

        <div class="control-group export-buttons">
          <button class="export-btn" onClick={exportAsSVG}>Export SVG</button>
          <button class="export-btn" onClick={exportAsJSON}>Export JSON</button>
        </div>

        <div class="control-group config-buttons">
          <button class="config-btn" onClick={saveConfiguration}>Save Config</button>
          <button class="config-btn" onClick={loadConfiguration}>Load Config</button>
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
            <span class="stat-value">{dimensions().width} × {dimensions().height}</span>
          </div>
        </div>
      </div>

      <div class="instructions">
        {tutorialMode()
          ? 'Tutorial mode: Use controls to step through algorithm'
          : selectedGenerator() === 'interactive'
          ? 'Click to place points • Shift+drag or middle mouse to pan • Scroll to zoom'
          : 'Click to regenerate • Shift+drag to pan • Scroll to zoom'}
      </div>
    </div>
  );
}

export default App;
