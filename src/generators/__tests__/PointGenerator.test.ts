import { describe, it, expect } from 'vitest';
import {
  RandomPointGenerator,
  GridPointGenerator,
  CircularPointGenerator,
  SpiralPointGenerator,
  PoissonDiskPointGenerator,
  PointGeneratorFactory
} from '../PointGenerator';

describe('RandomPointGenerator', () => {
  it('should generate the correct number of points', () => {
    const generator = new RandomPointGenerator();
    const points = generator.generate(800, 600, { count: 50 });
    expect(points).toHaveLength(50);
  });

  it('should generate points within bounds', () => {
    const generator = new RandomPointGenerator();
    const width = 800;
    const height = 600;
    const points = generator.generate(width, height, { count: 50 });

    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(height);
    }
  });

  it('should respect margin parameter', () => {
    const generator = new RandomPointGenerator();
    const width = 800;
    const height = 600;
    const margin = 0.1;
    const points = generator.generate(width, height, { count: 50, margin });

    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(width * margin);
      expect(point.x).toBeLessThanOrEqual(width * (1 - margin));
      expect(point.y).toBeGreaterThanOrEqual(height * margin);
      expect(point.y).toBeLessThanOrEqual(height * (1 - margin));
    }
  });
});

describe('GridPointGenerator', () => {
  it('should generate points in a grid', () => {
    const generator = new GridPointGenerator();
    const points = generator.generate(800, 600, { rows: 5, cols: 5 });
    expect(points).toHaveLength(25);
  });

  it('should space points evenly', () => {
    const generator = new GridPointGenerator();
    const points = generator.generate(800, 600, { rows: 3, cols: 3, jitter: 0 });
    expect(points).toHaveLength(9);

    // Check that points are evenly spaced (no jitter)
    const spacingX = 800 / 4; // (cols + 1)
    const spacingY = 600 / 4; // (rows + 1)

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const point = points[row * 3 + col];
        expect(point.x).toBeCloseTo((col + 1) * spacingX);
        expect(point.y).toBeCloseTo((row + 1) * spacingY);
      }
    }
  });
});

describe('CircularPointGenerator', () => {
  it('should generate points in concentric circles', () => {
    const generator = new CircularPointGenerator();
    const points = generator.generate(800, 600, { rings: 3, pointsPerRing: 6, includeCenter: true });

    // Formula: center + sum of (ring * pointsPerRing) for each ring
    // center: 1
    // ring 1: 6
    // ring 2: 12
    // ring 3: 18
    // total: 37
    expect(points).toHaveLength(37);
  });

  it('should place first point at center when includeCenter is true', () => {
    const generator = new CircularPointGenerator();
    const width = 800;
    const height = 600;
    const points = generator.generate(width, height, { includeCenter: true });

    const firstPoint = points[0];
    expect(firstPoint.x).toBeCloseTo(width / 2);
    expect(firstPoint.y).toBeCloseTo(height / 2);
  });

  it('should not include center when includeCenter is false', () => {
    const generator = new CircularPointGenerator();
    const width = 800;
    const height = 600;
    const points = generator.generate(width, height, { rings: 3, pointsPerRing: 6, includeCenter: false });

    const firstPoint = points[0];
    const centerX = width / 2;
    const centerY = height / 2;

    // First point should not be at center
    expect(Math.abs(firstPoint.x - centerX) > 1 || Math.abs(firstPoint.y - centerY) > 1).toBe(true);
  });
});

describe('SpiralPointGenerator', () => {
  it('should generate the correct number of points', () => {
    const generator = new SpiralPointGenerator();
    const points = generator.generate(800, 600, { count: 50 });
    expect(points).toHaveLength(50);
  });

  it('should generate points in a spiral pattern', () => {
    const generator = new SpiralPointGenerator();
    const width = 800;
    const height = 600;
    const points = generator.generate(width, height, { count: 100 });

    const centerX = width / 2;
    const centerY = height / 2;

    // Check that distance from center increases roughly monotonically
    const distances = points.map(p =>
      Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
    );

    // Most distances should be increasing (allowing some variance)
    let increasing = 0;
    for (let i = 1; i < distances.length; i++) {
      if (distances[i] >= distances[i - 1]) {
        increasing++;
      }
    }

    // At least 90% should be increasing
    expect(increasing / (distances.length - 1)).toBeGreaterThan(0.9);
  });
});

describe('PoissonDiskPointGenerator', () => {
  it('should generate approximately the requested number of points', () => {
    const generator = new PoissonDiskPointGenerator();
    const points = generator.generate(800, 600, { count: 50 });

    // Poisson disk sampling is approximate, so allow some variance
    expect(points.length).toBeGreaterThan(30);
    expect(points.length).toBeLessThan(70);
  });

  it('should maintain minimum distance between points', () => {
    const generator = new PoissonDiskPointGenerator();
    const minDistance = 30;
    const points = generator.generate(800, 600, { count: 50, minDistance });

    // Check all pairs of points
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = points[i].distanceTo(points[j]);
        expect(dist).toBeGreaterThanOrEqual(minDistance - 0.001); // Small epsilon for floating point
      }
    }
  });
});

describe('PointGeneratorFactory', () => {
  it('should create random generator', () => {
    const generator = PointGeneratorFactory.create('random');
    expect(generator).toBeInstanceOf(RandomPointGenerator);
  });

  it('should create grid generator', () => {
    const generator = PointGeneratorFactory.create('grid');
    expect(generator).toBeInstanceOf(GridPointGenerator);
  });

  it('should create circular generator', () => {
    const generator = PointGeneratorFactory.create('circular');
    expect(generator).toBeInstanceOf(CircularPointGenerator);
  });

  it('should create spiral generator', () => {
    const generator = PointGeneratorFactory.create('spiral');
    expect(generator).toBeInstanceOf(SpiralPointGenerator);
  });

  it('should create poisson generator', () => {
    const generator = PointGeneratorFactory.create('poisson');
    expect(generator).toBeInstanceOf(PoissonDiskPointGenerator);
  });

  it('should throw error for unknown generator type', () => {
    expect(() => {
      PointGeneratorFactory.create('unknown');
    }).toThrow('Unknown generator type: unknown');
  });

  it('should list available generators', () => {
    const generators = PointGeneratorFactory.getAvailableGenerators();
    expect(generators).toContain('random');
    expect(generators).toContain('grid');
    expect(generators).toContain('circular');
    expect(generators).toContain('spiral');
    expect(generators).toContain('poisson');
  });
});
