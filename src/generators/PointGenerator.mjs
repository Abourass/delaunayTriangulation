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
 * Generates points in a spiral pattern using golden ratio
 */
export class SpiralPointGenerator extends PointGenerator {
  /**
   * Generate points in a golden spiral pattern
   * @param {number} width - Width of the area
   * @param {number} height - Height of the area
   * @param {Object} options - Options for generation
   * @param {number} [options.count=50] - Number of points
   * @param {number} [options.turns=8] - Number of spiral turns
   * @returns {Point[]} Array of generated points
   */
  generate(width, height, options = {}) {
    const count = options.count ?? 50;
    const turns = options.turns ?? 8;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.45;

    const points = [];

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const radius = maxRadius * Math.sqrt(t);
      const angle = i * goldenAngle * turns;

      points.push(new Point(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      ));
    }

    return points;
  }
}

/**
 * Generates points using Poisson Disk Sampling for natural-looking distribution
 */
export class PoissonDiskPointGenerator extends PointGenerator {
  /**
   * Generate points with Poisson Disk Sampling
   * @param {number} width - Width of the area
   * @param {number} height - Height of the area
   * @param {Object} options - Options for generation
   * @param {number} [options.count=50] - Target number of points (approximate)
   * @param {number} [options.minDistance] - Minimum distance between points
   * @param {number} [options.maxAttempts=30] - Max attempts per active point
   * @returns {Point[]} Array of generated points
   */
  generate(width, height, options = {}) {
    const count = options.count ?? 50;
    // Calculate minimum distance based on desired count
    const area = width * height;
    const minDistance = options.minDistance ?? Math.sqrt(area / (count * 2));
    const maxAttempts = options.maxAttempts ?? 30;

    const cellSize = minDistance / Math.sqrt(2);
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid = new Array(gridWidth * gridHeight).fill(-1);

    const points = [];
    const activeList = [];

    const margin = minDistance;

    // Helper to get grid index
    const gridIndex = (x, y) => {
      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);
      return gy * gridWidth + gx;
    };

    // Helper to check if point is valid
    const isValid = (x, y) => {
      if (x < margin || x >= width - margin || y < margin || y >= height - margin) {
        return false;
      }

      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);

      // Check neighboring cells (5x5 grid)
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;

          if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
            const idx = ny * gridWidth + nx;
            if (grid[idx] !== -1) {
              const other = points[grid[idx]];
              const dist = Math.sqrt((x - other.x) ** 2 + (y - other.y) ** 2);
              if (dist < minDistance) {
                return false;
              }
            }
          }
        }
      }

      return true;
    };

    // Start with a random point
    const startX = margin + Math.random() * (width - 2 * margin);
    const startY = margin + Math.random() * (height - 2 * margin);
    const startIdx = gridIndex(startX, startY);

    points.push(new Point(startX, startY));
    grid[startIdx] = 0;
    activeList.push(0);

    // Generate points
    while (activeList.length > 0 && points.length < count * 2) {
      const activeIdx = Math.floor(Math.random() * activeList.length);
      const pointIdx = activeList[activeIdx];
      const point = points[pointIdx];

      let found = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = minDistance + Math.random() * minDistance;
        const newX = point.x + Math.cos(angle) * distance;
        const newY = point.y + Math.sin(angle) * distance;

        if (isValid(newX, newY)) {
          const newIdx = gridIndex(newX, newY);
          points.push(new Point(newX, newY));
          grid[newIdx] = points.length - 1;
          activeList.push(points.length - 1);
          found = true;
          break;
        }
      }

      if (!found) {
        activeList.splice(activeIdx, 1);
      }
    }

    // Trim to approximate count if we generated too many
    if (points.length > count) {
      return points.slice(0, count);
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
    circular: CircularPointGenerator,
    spiral: SpiralPointGenerator,
    poisson: PoissonDiskPointGenerator
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
