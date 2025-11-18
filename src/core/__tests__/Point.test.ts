import { describe, it, expect } from 'vitest';
import { Point } from '../Point';

describe('Point', () => {
  describe('constructor', () => {
    it('should create a point with x and y coordinates', () => {
      const p = new Point(3, 4);
      expect(p.x).toBe(3);
      expect(p.y).toBe(4);
    });
  });

  describe('add', () => {
    it('should add two points', () => {
      const p1 = new Point(1, 2);
      const p2 = new Point(3, 4);
      const result = p1.add(p2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should not mutate original points', () => {
      const p1 = new Point(1, 2);
      const p2 = new Point(3, 4);
      p1.add(p2);
      expect(p1.x).toBe(1);
      expect(p1.y).toBe(2);
    });
  });

  describe('sub', () => {
    it('should subtract two points', () => {
      const p1 = new Point(5, 7);
      const p2 = new Point(2, 3);
      const result = p1.sub(p2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });
  });

  describe('mult', () => {
    it('should multiply point by scalar', () => {
      const p = new Point(2, 3);
      const result = p.mult(3);
      expect(result.x).toBe(6);
      expect(result.y).toBe(9);
    });
  });

  describe('div', () => {
    it('should divide point by scalar', () => {
      const p = new Point(6, 9);
      const result = p.div(3);
      expect(result.x).toBe(2);
      expect(result.y).toBe(3);
    });
  });

  describe('getLength', () => {
    it('should calculate vector length', () => {
      const p = new Point(3, 4);
      expect(p.getLength()).toBe(5);
    });

    it('should return 0 for zero vector', () => {
      const p = new Point(0, 0);
      expect(p.getLength()).toBe(0);
    });
  });

  describe('getLengthSquared', () => {
    it('should calculate squared vector length', () => {
      const p = new Point(3, 4);
      expect(p.getLengthSquared()).toBe(25);
    });
  });

  describe('distanceTo', () => {
    it('should calculate distance between points', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(3, 4);
      expect(p1.distanceTo(p2)).toBe(5);
    });
  });

  describe('distanceToSquared', () => {
    it('should calculate squared distance between points', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(3, 4);
      expect(p1.distanceToSquared(p2)).toBe(25);
    });
  });

  describe('equals', () => {
    it('should return true for equal points', () => {
      const p1 = new Point(1, 2);
      const p2 = new Point(1, 2);
      expect(p1.equals(p2)).toBe(true);
    });

    it('should return false for different points', () => {
      const p1 = new Point(1, 2);
      const p2 = new Point(1, 3);
      expect(p1.equals(p2)).toBe(false);
    });
  });

  describe('approximatelyEquals', () => {
    it('should return true for points within epsilon', () => {
      const p1 = new Point(1.0, 2.0);
      const p2 = new Point(1.000000001, 2.000000001);
      expect(p1.approximatelyEquals(p2, 1e-8)).toBe(true);
    });

    it('should return false for points outside epsilon', () => {
      const p1 = new Point(1.0, 2.0);
      const p2 = new Point(1.1, 2.0);
      expect(p1.approximatelyEquals(p2)).toBe(false);
    });
  });

  describe('copy', () => {
    it('should create a copy of the point', () => {
      const p1 = new Point(1, 2);
      const p2 = p1.copy();
      expect(p2.x).toBe(1);
      expect(p2.y).toBe(2);
      expect(p2).not.toBe(p1);
    });
  });

  describe('static fromPolar', () => {
    it('should create point from polar coordinates', () => {
      const p = Point.fromPolar(0, 5);
      expect(p.x).toBeCloseTo(5);
      expect(p.y).toBeCloseTo(0);
    });

    it('should create point at 90 degrees', () => {
      const p = Point.fromPolar(Math.PI / 2, 5);
      expect(p.x).toBeCloseTo(0);
      expect(p.y).toBeCloseTo(5);
    });
  });

  describe('static zero', () => {
    it('should create zero point', () => {
      const p = Point.zero();
      expect(p.x).toBe(0);
      expect(p.y).toBe(0);
    });
  });
});
