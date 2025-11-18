import { Point } from '../core/Point';

/**
 * Options for point generation
 */
export interface GeneratorOptions {
  count?: number;
  density?: number;
  margin?: number;
  rows?: number;
  cols?: number;
  spacing?: number;
  jitter?: number;
  rings?: number;
  pointsPerRing?: number;
  includeCenter?: boolean;
  turns?: number;
  minDistance?: number;
  maxAttempts?: number;
}

/**
 * Strategy interface for generating points.
 * Different generators can create different distributions of points.
 */
export abstract class PointGenerator {
  /**
   * Generate points within a given area
   * @param width - Width of the area
   * @param height - Height of the area
   * @param options - Generator-specific options
   * @returns Array of generated points
   */
  abstract generate(width: number, height: number, options?: GeneratorOptions): Point[];
}

/**
 * Generates random points with uniform distribution
 */
export class RandomPointGenerator extends PointGenerator {
  /**
   * Generate randomly distributed points
   * @param width - Width of the area
   * @param height - Height of the area
   * @param options - Options for generation
   * @returns Array of generated points
   */
  generate(width: number, height: number, options: GeneratorOptions = {}): Point[] {
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

    const points: Point[] = [];
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
   * @param width - Width of the area
   * @param height - Height of the area
   * @param options - Options for generation
   * @returns Array of generated points
   */
  generate(width: number, height: number, options: GeneratorOptions = {}): Point[] {
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

    const points: Point[] = [];
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
   * @param width - Width of the area
   * @param height - Height of the area
   * @param options - Options for generation
   * @returns Array of generated points
   */
  generate(width: number, height: number, options: GeneratorOptions = {}): Point[] {
    const rings = options.rings ?? 5;
    const pointsPerRing = options.pointsPerRing ?? 8;
    const includeCenter = options.includeCenter ?? true;

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;

    const points: Point[] = [];

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
   * @param width - Width of the area
   * @param height - Height of the area
   * @param options - Options for generation
   * @returns Array of generated points
   */
  generate(width: number, height: number, options: GeneratorOptions = {}): Point[] {
    const count = options.count ?? 50;
    const turns = options.turns ?? 8;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.45;

    const points: Point[] = [];

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
   * @param width - Width of the area
   * @param height - Height of the area
   * @param options - Options for generation
   * @returns Array of generated points
   */
  generate(width: number, height: number, options: GeneratorOptions = {}): Point[] {
    const count = options.count ?? 50;
    // Calculate minimum distance based on desired count
    const area = width * height;
    const minDistance = options.minDistance ?? Math.sqrt(area / (count * 2));
    const maxAttempts = options.maxAttempts ?? 30;

    const cellSize = minDistance / Math.sqrt(2);
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid: number[] = new Array(gridWidth * gridHeight).fill(-1);

    const points: Point[] = [];
    const activeList: number[] = [];

    const margin = minDistance;

    // Helper to get grid index
    const gridIndex = (x: number, y: number): number => {
      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);
      return gy * gridWidth + gx;
    };

    // Helper to check if point is valid
    const isValid = (x: number, y: number): boolean => {
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
  private static generators: Record<string, new () => PointGenerator> = {
    random: RandomPointGenerator,
    grid: GridPointGenerator,
    circular: CircularPointGenerator,
    spiral: SpiralPointGenerator,
    poisson: PoissonDiskPointGenerator
  };

  /**
   * Register a new generator type
   * @param name - Name of the generator
   * @param GeneratorClass - The generator class
   */
  static register(name: string, GeneratorClass: new () => PointGenerator): void {
    this.generators[name] = GeneratorClass;
  }

  /**
   * Create a generator by name
   * @param name - Name of the generator
   * @returns A new generator instance
   */
  static create(name: string): PointGenerator {
    const GeneratorClass = this.generators[name];
    if (!GeneratorClass) {
      throw new Error(`Unknown generator type: ${name}`);
    }
    return new GeneratorClass();
  }

  /**
   * Get list of available generator names
   * @returns Array of generator names
   */
  static getAvailableGenerators(): string[] {
    return Object.keys(this.generators);
  }
}

export default PointGenerator;
