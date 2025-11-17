/**
 * Delaunay Triangulation Library
 *
 * A modular library for Delaunay triangulation with customizable
 * point generation, rendering, and algorithm strategies.
 *
 * @module delaunay-triangulation
 */

// Core geometry primitives
export { Point } from './core/Point.mjs';
export { Edge } from './core/Edge.mjs';
export { Triangle } from './core/Triangle.mjs';

// Algorithms
export { BowyerWatson } from './algorithms/BowyerWatson.mjs';

// Point generators
export {
  PointGenerator,
  RandomPointGenerator,
  GridPointGenerator,
  CircularPointGenerator,
  PointGeneratorFactory
} from './generators/PointGenerator.mjs';

// Renderers
export { Renderer } from './rendering/Renderer.mjs';
export { CanvasRenderer } from './rendering/CanvasRenderer.mjs';

// Application
export { DelaunayApp } from './app/DelaunayApp.mjs';
