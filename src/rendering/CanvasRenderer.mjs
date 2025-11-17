import { Renderer } from './Renderer.mjs';

/**
 * Canvas 2D implementation of the Renderer interface.
 * Renders triangulations using the HTML5 Canvas API.
 */
export class CanvasRenderer extends Renderer {
  /**
   * Create a Canvas renderer
   * @param {HTMLCanvasElement} canvas - The canvas element
   */
  constructor(canvas) {
    super(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * Set up the rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setup(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Clear the canvas
   * @param {string} [color='white'] - Background color
   */
  clear(color = 'white') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Render a single triangle
   * @param {Triangle} triangle - The triangle to render
   * @param {Object} [style] - Rendering style options
   * @param {string} [style.strokeStyle='black'] - Stroke color
   * @param {number} [style.lineWidth] - Line width (random 1-4 if not specified)
   * @param {string} [style.fillStyle] - Fill color (optional)
   * @param {boolean} [style.drawInteriorLines=true] - Draw interior parallel lines
   * @param {number} [style.interiorLineCount] - Number of interior lines (random 2-11 if not specified)
   */
  renderTriangle(triangle, style = {}) {
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
   * @param {Triangle} triangle - The triangle
   * @param {number} count - Number of lines to draw
   */
  drawInteriorLines(triangle, count) {
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
   * @param {Point} p1 - Start point
   * @param {Point} p2 - End point
   * @param {number} count - Number of points
   * @returns {Point[]} Array of points
   */
  getPointsOnLine(p1, p2, count) {
    const points = [];
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
   * @param {Point} point - The point to render
   * @param {Object} [style] - Rendering style options
   * @param {string} [style.fillStyle='red'] - Fill color
   * @param {number} [style.radius=3] - Point radius
   */
  renderPoint(point, style = {}) {
    const ctx = this.ctx;
    const radius = style.radius ?? 3;

    ctx.fillStyle = style.fillStyle ?? 'red';
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render an edge
   * @param {Edge} edge - The edge to render
   * @param {Object} [style] - Rendering style options
   * @param {string} [style.strokeStyle='black'] - Stroke color
   * @param {number} [style.lineWidth=1] - Line width
   */
  renderEdge(edge, style = {}) {
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
   * @param {Triangle} triangle - The triangle
   * @param {Object} [style] - Rendering style options
   * @param {string} [style.strokeStyle='blue'] - Stroke color
   * @param {number} [style.lineWidth=1] - Line width
   */
  renderCircumcircle(triangle, style = {}) {
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
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    super.resize(width, height);
    this.setup(width, height);
  }
}

export default CanvasRenderer;
