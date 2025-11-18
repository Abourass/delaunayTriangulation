import { Renderer, RenderStyle } from './Renderer';
import { Point } from '../core/Point';
import { Edge } from '../core/Edge';
import { Triangle } from '../core/Triangle';

/**
 * Canvas 2D implementation of the Renderer interface.
 * Renders triangulations using the HTML5 Canvas API.
 */
export class CanvasRenderer extends Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  /**
   * Create a Canvas renderer
   * @param canvas - The canvas element
   */
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
  }

  /**
   * Set up the rendering context
   * @param width - Canvas width
   * @param height - Canvas height
   */
  setup(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Clear the canvas
   * @param color - Background color
   */
  clear(color: string = 'white'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Render a single triangle
   * @param triangle - The triangle to render
   * @param style - Rendering style options
   */
  renderTriangle(triangle: Triangle, style: RenderStyle = {}): void {
    const ctx = this.ctx;

    // Set stroke style
    ctx.strokeStyle = style.strokeStyle ?? 'black';
    ctx.lineWidth = style.lineWidth ?? (Math.random() * 3 + 1);

    // Draw the triangle outline
    ctx.beginPath();
    ctx.moveTo(triangle.a.x, triangle.a.y);
    ctx.lineTo(triangle.b.x, triangle.b.y);
    ctx.lineTo(triangle.c.x, triangle.c.y);
    ctx.closePath();

    if (style.fillStyle) {
      ctx.fillStyle = style.fillStyle;
      ctx.fill();
    }

    ctx.stroke();

    // Draw interior parallel lines (similar triangles effect)
    if (style.drawInteriorLines !== false) {
      const lineCount = style.interiorLineCount ?? Math.round(Math.random() * 9 + 2);
      this.drawInteriorLines(triangle, lineCount);
    }
  }

  /**
   * Draw interior parallel lines within a triangle
   * Creates the "similar triangles" visual effect
   * @param triangle - The triangle
   * @param count - Number of lines to draw
   */
  private drawInteriorLines(triangle: Triangle, count: number): void {
    const ctx = this.ctx;
    const { a, b, c } = triangle;

    // Get points along two edges from vertex c
    const points1 = this.getPointsOnLine(c, a, count);
    const points2 = this.getPointsOnLine(c, b, count);

    // Connect corresponding points
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(points1[i].x, points1[i].y);
      ctx.lineTo(points2[i].x, points2[i].y);
      ctx.stroke();
    }
  }

  /**
   * Get evenly spaced points along a line segment
   * @param p1 - Start point
   * @param p2 - End point
   * @param count - Number of points
   * @returns Array of points
   */
  private getPointsOnLine(p1: Point, p2: Point, count: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const dx = (p2.x - p1.x) / (count + 1);
    const dy = (p2.y - p1.y) / (count + 1);

    for (let i = 1; i <= count; i++) {
      points.push({
        x: p1.x + dx * i,
        y: p1.y + dy * i
      });
    }

    return points;
  }

  /**
   * Render a single point
   * @param point - The point to render
   * @param style - Rendering style options
   */
  renderPoint(point: Point, style: RenderStyle = {}): void {
    const ctx = this.ctx;
    const radius = style.radius ?? 3;

    ctx.fillStyle = style.fillStyle ?? 'red';
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render an edge
   * @param edge - The edge to render
   * @param style - Rendering style options
   */
  renderEdge(edge: Edge, style: RenderStyle = {}): void {
    const ctx = this.ctx;

    ctx.strokeStyle = style.strokeStyle ?? 'black';
    ctx.lineWidth = style.lineWidth ?? 1;

    ctx.beginPath();
    ctx.moveTo(edge.p1.x, edge.p1.y);
    ctx.lineTo(edge.p2.x, edge.p2.y);
    ctx.stroke();
  }

  /**
   * Render the circumcircle of a triangle
   * @param triangle - The triangle
   * @param style - Rendering style options
   */
  renderCircumcircle(triangle: Triangle, style: RenderStyle = {}): void {
    const ctx = this.ctx;
    const center = triangle.getCircumcenter();
    const radius = triangle.getCircumradius();

    ctx.strokeStyle = style.strokeStyle ?? 'blue';
    ctx.lineWidth = style.lineWidth ?? 1;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Resize the canvas
   * @param width - New width
   * @param height - New height
   */
  resize(width: number, height: number): void {
    super.resize(width, height);
    this.setup(width, height);
  }
}

export default CanvasRenderer;
