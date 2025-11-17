import { Point, Triangle } from '../core/index.mjs';
import { BowyerWatson } from '../algorithms/BowyerWatson.mjs';
import { CanvasRenderer } from '../rendering/CanvasRenderer.mjs';
import { RandomPointGenerator, PointGeneratorFactory } from '../generators/PointGenerator.mjs';

/**
 * Main application orchestrator for Delaunay triangulation visualization.
 * This class coordinates all the components and manages the application state.
 */
export class DelaunayApp {
  /**
   * Create a Delaunay triangulation application
   * @param {Object} config - Configuration options
   * @param {HTMLCanvasElement} config.canvas - The canvas element
   * @param {Object} [config.pointGeneratorOptions] - Options for point generation
   * @param {Object} [config.renderOptions] - Options for rendering
   * @param {boolean} [config.autoResize=true] - Automatically handle window resize
   * @param {boolean} [config.clickToRedraw=true] - Redraw on canvas click
   */
  constructor(config) {
    this.canvas = config.canvas;
    this.pointGeneratorOptions = config.pointGeneratorOptions ?? {};
    this.renderOptions = config.renderOptions ?? {};
    this.autoResize = config.autoResize ?? true;
    this.clickToRedraw = config.clickToRedraw ?? true;

    // Initialize components
    this.renderer = new CanvasRenderer(this.canvas);
    this.pointGenerator = new RandomPointGenerator();
    this.triangulator = BowyerWatson;

    // Current state
    this.currentPoints = [];
    this.currentTriangles = [];

    // Event handlers (bound for removal)
    this.handleResize = this.handleResize.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  /**
   * Initialize the application
   */
  setup() {
    this.updateDimensions();
    this.bindEvents();
    this.draw();
  }

  /**
   * Update canvas dimensions to match window
   */
  updateDimensions() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setup(width, height);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (this.autoResize) {
      window.addEventListener('resize', this.handleResize);
    }

    if (this.clickToRedraw) {
      this.canvas.addEventListener('click', this.handleClick);
    }
  }

  /**
   * Remove event listeners
   */
  unbindEvents() {
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('click', this.handleClick);
  }

  /**
   * Handle window resize event
   */
  handleResize() {
    this.updateDimensions();
    this.draw();
  }

  /**
   * Handle canvas click event
   */
  handleClick() {
    this.draw();
  }

  /**
   * Generate new triangulation and render it
   */
  draw() {
    const { width, height } = this.renderer.getDimensions();

    // Generate points
    this.currentPoints = this.pointGenerator.generate(width, height, this.pointGeneratorOptions);

    // Perform triangulation
    this.triangulate();

    // Render
    this.render();
  }

  /**
   * Perform Delaunay triangulation on current points
   */
  triangulate() {
    if (this.currentPoints.length < 3) {
      this.currentTriangles = [];
      return;
    }

    const { width, height } = this.renderer.getDimensions();

    // Create super triangle that encompasses the entire canvas
    const superTriangle = new Triangle(
      new Point(-width * 2, height * 2),
      new Point(width * 2, height * 2),
      new Point(width / 2, -height * 2)
    );

    this.currentTriangles = this.triangulator.triangulate(this.currentPoints, superTriangle);
  }

  /**
   * Render the current triangulation
   */
  render() {
    this.renderer.clear('white');
    this.renderer.renderTriangles(this.currentTriangles, this.renderOptions);
  }

  /**
   * Set a new point generator
   * @param {PointGenerator} generator - The new generator
   */
  setPointGenerator(generator) {
    this.pointGenerator = generator;
  }

  /**
   * Set point generator by name
   * @param {string} name - Generator name ('random', 'grid', 'circular')
   */
  setPointGeneratorByName(name) {
    this.pointGenerator = PointGeneratorFactory.create(name);
  }

  /**
   * Set point generator options
   * @param {Object} options - New options
   */
  setPointGeneratorOptions(options) {
    this.pointGeneratorOptions = options;
  }

  /**
   * Set rendering options
   * @param {Object} options - New rendering options
   */
  setRenderOptions(options) {
    this.renderOptions = options;
  }

  /**
   * Get current triangulation statistics
   * @returns {Object} Statistics about the current triangulation
   */
  getStatistics() {
    return {
      pointCount: this.currentPoints.length,
      triangleCount: this.currentTriangles.length,
      canvasWidth: this.renderer.width,
      canvasHeight: this.renderer.height,
      area: this.renderer.width * this.renderer.height,
      density: this.currentPoints.length / (this.renderer.width * this.renderer.height) * 10000
    };
  }

  /**
   * Add a single point to the current triangulation
   * @param {Point} point - The point to add
   */
  addPoint(point) {
    this.currentPoints.push(point);
    this.triangulate();
    this.render();
  }

  /**
   * Clear all points and triangles
   */
  clear() {
    this.currentPoints = [];
    this.currentTriangles = [];
    this.renderer.clear('white');
  }

  /**
   * Clean up resources and event listeners
   */
  destroy() {
    this.unbindEvents();
    this.clear();
  }

  /**
   * Export current state
   * @returns {Object} Serializable state object
   */
  exportState() {
    return {
      points: this.currentPoints.map(p => ({ x: p.x, y: p.y })),
      dimensions: this.renderer.getDimensions()
    };
  }

  /**
   * Import state from serialized object
   * @param {Object} state - State to import
   */
  importState(state) {
    if (state.dimensions) {
      this.renderer.setup(state.dimensions.width, state.dimensions.height);
    }

    if (state.points) {
      this.currentPoints = state.points.map(p => new Point(p.x, p.y));
      this.triangulate();
      this.render();
    }
  }
}

export default DelaunayApp;
