import { createEffect, on } from 'solid-js';
import { Point, Triangle } from '../core/index';
import { BowyerWatson } from '../algorithms/BowyerWatson';
import { triangulationState, setTriangulationState } from '../stores/triangulationStore';
import {
  RandomPointGenerator,
  GridPointGenerator,
  CircularPointGenerator,
  SpiralPointGenerator,
  PoissonDiskPointGenerator,
} from '../generators/PointGenerator';

export function useTriangulation() {
  const getGenerator = () => {
    switch (triangulationState.selectedGenerator) {
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
    const count = triangulationState.pointCount;
    switch (triangulationState.selectedGenerator) {
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

  const generatePoints = (): Point[] => {
    if (triangulationState.selectedGenerator === 'interactive') {
      return [...triangulationState.interactivePoints];
    }

    const { width, height } = triangulationState.dimensions;
    const generator = getGenerator();
    const options = getGeneratorOptions();
    return generator.generate(width, height, options);
  };

  const triangulate = (points: Point[]): Triangle[] => {
    if (points.length < 3) {
      return [];
    }

    const { width, height } = triangulationState.dimensions;
    return BowyerWatson.triangulate(points, width, height);
  };

  const regenerate = () => {
    const { width, height } = triangulationState.dimensions;

    // Don't regenerate if canvas isn't set up yet
    if (width === 0 || height === 0) {
      return;
    }

    const newPoints = generatePoints();
    const newTriangles = triangulate(newPoints);

    setTriangulationState({
      points: newPoints,
      triangles: newTriangles,
    });
  };

  // Auto-regenerate when generator or point count changes
  createEffect(on(
    () => [triangulationState.selectedGenerator, triangulationState.pointCount],
    () => {
      if (triangulationState.selectedGenerator !== 'interactive') {
        regenerate();
      }
    }
  ));

  // Generate initial triangulation when canvas dimensions are first set
  createEffect(on(
    () => triangulationState.dimensions,
    (dims, prevDims) => {
      // Only run on first setup (dimensions go from 0,0 to actual size)
      if (prevDims && prevDims.width === 0 && prevDims.height === 0 && dims.width > 0 && dims.height > 0) {
        regenerate();
      }
    }
  ));

  return {
    generatePoints,
    triangulate,
    regenerate,
  };
}
