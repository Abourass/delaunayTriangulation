import { onMount, onCleanup, createEffect } from 'solid-js';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { triangulationState, setTriangulationState } from '../stores/triangulationStore';

export function useCanvasRenderer(canvasRef: () => HTMLCanvasElement | undefined) {
  let renderer: CanvasRenderer | undefined;
  let resizeObserver: ResizeObserver | undefined;

  const setupCanvas = () => {
    const canvas = canvasRef();
    if (!canvas) return;

    renderer = new CanvasRenderer(canvas);

    // Set up responsive canvas sizing
    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      renderer?.setup(width, height);
      setTriangulationState({
        dimensions: { width, height },
      });
    };

    resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvas.parentElement!);

    updateSize();
  };

  const render = () => {
    if (!renderer) return;

    const ctx = renderer['ctx'] as CanvasRenderingContext2D;
    const { width, height } = triangulationState.dimensions;

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(triangulationState.panOffset.x, triangulationState.panOffset.y);
    ctx.scale(triangulationState.zoom, triangulationState.zoom);

    // Clear canvas
    renderer.clear(triangulationState.backgroundColor);

    // Render triangles
    for (const triangle of triangulationState.triangles) {
      let fillStyle: string | undefined;

      if (triangulationState.colorMode === 'area') {
        const area = triangle.getArea();
        const maxArea = width * height / 4;
        const hue = (area / maxArea) * 360;
        fillStyle = `hsla(${hue}, 70%, 60%, 0.3)`;
      } else if (triangulationState.colorMode === 'aspect') {
        const edges = triangle.getEdges();
        const lengths = edges.map(e => e.getLength());
        const maxLength = Math.max(...lengths);
        const minLength = Math.min(...lengths);
        const aspectRatio = maxLength / minLength;
        const hue = Math.min(120, (aspectRatio - 1) * 60);
        fillStyle = `hsla(${120 - hue}, 70%, 60%, 0.3)`;
      } else if (triangulationState.colorMode === 'random') {
        const hue = Math.random() * 360;
        fillStyle = `hsla(${hue}, 70%, 60%, 0.3)`;
      }

      renderer.renderTriangle(triangle, {
        strokeStyle: triangulationState.strokeColor,
        lineWidth: triangulationState.lineWidth,
        fillStyle,
      });
    }

    // Render circumcircles if enabled
    if (triangulationState.showCircumcircles) {
      for (const triangle of triangulationState.triangles) {
        renderer.renderCircumcircle(triangle, {
          strokeStyle: 'rgba(0, 0, 255, 0.3)',
          lineWidth: 1,
        });
      }
    }

    // Render points if enabled
    if (triangulationState.showPoints) {
      for (const point of triangulationState.points) {
        renderer.renderPoint(point, {
          fillStyle: 'red',
          radius: 3,
        });
      }
    }

    ctx.restore();
  };

  onMount(() => {
    setupCanvas();
  });

  onCleanup(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  // Re-render when state changes
  createEffect(() => {
    // Dependencies
    triangulationState.triangles;
    triangulationState.points;
    triangulationState.colorMode;
    triangulationState.showCircumcircles;
    triangulationState.showPoints;
    triangulationState.strokeColor;
    triangulationState.backgroundColor;
    triangulationState.lineWidth;
    triangulationState.zoom;
    triangulationState.panOffset;

    render();
  });

  return {
    renderer: () => renderer,
    render,
  };
}
