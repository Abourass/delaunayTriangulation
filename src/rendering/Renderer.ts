import { Point } from '../core/Point';
import { Edge } from '../core/Edge';
import { Triangle } from '../core/Triangle';

/**
 * Rendering style options
 */
export interface RenderStyle {
  strokeStyle?: string;
  fillStyle?: string;
  lineWidth?: number;
  radius?: number;
  drawInteriorLines?: boolean;
  interiorLineCount?: number;
}

/**
 * Abstract base class for rendering triangulations.
 * Implement this interface to support different rendering backends.
 */
export abstract class Renderer {
  protected container: HTMLElement;
  protected width: number = 0;
  protected height: number = 0;

  /**
   * Initialize the renderer with a target element
   * @param container - The container element
   */
  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Set up the rendering context
   * @param width - Canvas width
   * @param height - Canvas height
   */
  abstract setup(width: number, height: number): void;

  /**
   * Clear the canvas/rendering area
   * @param color - Background color
   */
  abstract clear(color?: string): void;

  /**
   * Render a single triangle
   * @param triangle - The triangle to render
   * @param style - Rendering style options
   */
  abstract renderTriangle(triangle: Triangle, style?: RenderStyle): void;

  /**
   * Render multiple triangles
   * @param triangles - Array of triangles to render
   * @param style - Rendering style options
   */
  renderTriangles(triangles: Triangle[], style: RenderStyle = {}): void {
    for (const triangle of triangles) {
      this.renderTriangle(triangle, style);
    }
  }

  /**
   * Render a single point
   * @param point - The point to render
   * @param style - Rendering style options
   */
  abstract renderPoint(point: Point, style?: RenderStyle): void;

  /**
   * Render multiple points
   * @param points - Array of points to render
   * @param style - Rendering style options
   */
  renderPoints(points: Point[], style: RenderStyle = {}): void {
    for (const point of points) {
      this.renderPoint(point, style);
    }
  }

  /**
   * Render an edge
   * @param edge - The edge to render
   * @param style - Rendering style options
   */
  abstract renderEdge(edge: Edge, style?: RenderStyle): void;

  /**
   * Render the circumcircle of a triangle
   * @param triangle - The triangle
   * @param style - Rendering style options
   */
  abstract renderCircumcircle(triangle: Triangle, style?: RenderStyle): void;

  /**
   * Get the current dimensions
   * @returns Current dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Resize the rendering area
   * @param width - New width
   * @param height - New height
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

export default Renderer;
