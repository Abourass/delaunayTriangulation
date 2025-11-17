/**
 * Abstract base class for rendering triangulations.
 * Implement this interface to support different rendering backends.
 */
export class Renderer {
  /**
   * Initialize the renderer with a target element
   * @param {HTMLElement} container - The container element
   */
  constructor(container) {
    this.container = container;
    this.width = 0;
    this.height = 0;
  }

  /**
   * Set up the rendering context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setup(width, height) {
    throw new Error('Renderer.setup() must be implemented by subclass');
  }

  /**
   * Clear the canvas/rendering area
   * @param {string} [color='white'] - Background color
   */
  clear(color = 'white') {
    throw new Error('Renderer.clear() must be implemented by subclass');
  }

  /**
   * Render a single triangle
   * @param {Triangle} triangle - The triangle to render
   * @param {Object} [style] - Rendering style options
   */
  renderTriangle(triangle, style = {}) {
    throw new Error('Renderer.renderTriangle() must be implemented by subclass');
  }

  /**
   * Render multiple triangles
   * @param {Triangle[]} triangles - Array of triangles to render
   * @param {Object} [style] - Rendering style options
   */
  renderTriangles(triangles, style = {}) {
    for (const triangle of triangles) {
      this.renderTriangle(triangle, style);
    }
  }

  /**
   * Render a single point
   * @param {Point} point - The point to render
   * @param {Object} [style] - Rendering style options
   */
  renderPoint(point, style = {}) {
    throw new Error('Renderer.renderPoint() must be implemented by subclass');
  }

  /**
   * Render multiple points
   * @param {Point[]} points - Array of points to render
   * @param {Object} [style] - Rendering style options
   */
  renderPoints(points, style = {}) {
    for (const point of points) {
      this.renderPoint(point, style);
    }
  }

  /**
   * Render an edge
   * @param {Edge} edge - The edge to render
   * @param {Object} [style] - Rendering style options
   */
  renderEdge(edge, style = {}) {
    throw new Error('Renderer.renderEdge() must be implemented by subclass');
  }

  /**
   * Render the circumcircle of a triangle
   * @param {Triangle} triangle - The triangle
   * @param {Object} [style] - Rendering style options
   */
  renderCircumcircle(triangle, style = {}) {
    throw new Error('Renderer.renderCircumcircle() must be implemented by subclass');
  }

  /**
   * Get the current dimensions
   * @returns {{width: number, height: number}} Current dimensions
   */
  getDimensions() {
    return { width: this.width, height: this.height };
  }

  /**
   * Resize the rendering area
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }
}

export default Renderer;
