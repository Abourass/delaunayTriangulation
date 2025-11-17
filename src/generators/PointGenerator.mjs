import { Point } from '../core/Point.mjs';

/**
 * Strategy interface for generating points.
 * Different generators can create different distributions of points.
 */
export class PointGenerator {
  /**
   * Generate points within a given area
   * @param {number} width - Width of the area
   * @param {number} height - Height of the area
   * @param {Object} options - Generator-specific options
   * @returns {Point[]} Array of generated points
   */
  generate(width, height, options = {}) {
    throw new Error('PointGenerator.generate() must be implemented by subclass');
  }
}

/**
 * Generates random points with uniform distribution
 */
export class RandomPointGenerator extends PointGenerator {
  /**
   * Generate randomly distributed points
   * @param {number} width - Width of the area
   * @param {number} height - Height of the area
   * @param {Object} options - Options for generation
   * @param {number} [options.count] - Number of points to generate
   * @param {number} [options.density] - Points per 10000 square units (alternative to count)
   * @param {number} [options.margin=0.025] - Margin from edges as fraction of dimensions
   * @returns {Point[]} Array of generated points
   */
  generate(width, height, options = {}) {
    const margin = options.margin ?? 0.025;
    let count = options.count;

    if (!count) {
      // Default: density-based calculation
      const density = options.density ?? (1 / (Math.random() * 5 + 5));
      count = Math.floor((width * height) * density / 1000);
    }

    const minX = width * margin;
    const maxX = width * (1 - margin);
    const minY = height * margin;
    const maxY = height * (1 - margin);

    const points = [];
    for (let i = 0; i < count; i++) {
      points.push(new Point(
        Math.random() * (maxX - minX) + minX,
        Math.random() * (maxY - minY) + minY
      ));
    }

    return points;
  }
}

/**
 * Generates points in a regular grid pattern
 */
export class GridPointGenerator extends PointGenerator {
  /**
   * Generate points in a grid pattern
   * @param {number} width - Width of the area
   * @param {number} height - Height of the area
   * @param {Object} options - Options for generation
   * @param {number} [options.rows] - Number of rows
   * @param {number} [options.cols] - Number of columns
   * @param {number} [options.spacing] - Spacing between points (alternative)
   * @param {number} [options.jitter=0] - Random offset as fraction of spacing
   * @returns {Point[]} Array of generated points
   */
  generate(width, height, options = {}) {
    let rows = options.rows;
    let cols = options.cols;

    if (options.spacing) {
      cols = Math.floor(width / options.spacing);
      rows = Math.floor(height / options.spacing);
    }

    if (!rows || !cols) {
      rows = 10;
      cols = 10;
    }

    const jitter = options.jitter ?? 0;
    const spacingX = width / (cols + 1);
    const spacingY = height / (rows + 1);

    const points = [];
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        const x = col * spacingX + (Math.random() - 0.5) * spacingX * jitter;
        const y = row * spacingY + (Math.random() - 0.5) * spacingY * jitter;
        points.push(new Point(x, y));
      }
    }

    return points;
  }
}

/**
 * Generates points in a circular pattern
 */
export class CircularPointGenerator extends PointGenerator {
  /**
   * Generate points in concentric circles
   * @param {number} width - Width of the area
   * @param {number} height - Height of the area
   * @param {Object} options - Options for generation
   * @param {number} [options.rings=5] - Number of concentric rings
   * @param {number} [options.pointsPerRing=8] - Points per ring
   * @param {boolean} [options.includeCenter=true] - Include center point
   * @returns {Point[]} Array of generated points
   */
  generate(width, height, options = {}) {
    const rings = options.rings ?? 5;
    const pointsPerRing = options.pointsPerRing ?? 8;
    const includeCenter = options.includeCenter ?? true;

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;

    const points = [];

    if (includeCenter) {
      points.push(new Point(centerX, centerY));
    }

    for (let ring = 1; ring <= rings; ring++) {
      const radius = (maxRadius * ring) / rings;
      const count = pointsPerRing * ring;

      for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        points.push(new Point(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        ));
      }
    }

    return points;
  }
}

/**
 * Factory for creating point generators
 */
export class PointGeneratorFactory {
  static generators = {
    random: RandomPointGenerator,
    grid: GridPointGenerator,
    circular: CircularPointGenerator
  };

  /**
   * Register a new generator type
   * @param {string} name - Name of the generator
   * @param {typeof PointGenerator} GeneratorClass - The generator class
   */
  static register(name, GeneratorClass) {
    this.generators[name] = GeneratorClass;
  }

  /**
   * Create a generator by name
   * @param {string} name - Name of the generator
   * @returns {PointGenerator} A new generator instance
   */
  static create(name) {
    const GeneratorClass = this.generators[name];
    if (!GeneratorClass) {
      throw new Error(`Unknown generator type: ${name}`);
    }
    return new GeneratorClass();
  }

  /**
   * Get list of available generator names
   * @returns {string[]} Array of generator names
   */
  static getAvailableGenerators() {
    return Object.keys(this.generators);
  }
}

export default PointGenerator;
