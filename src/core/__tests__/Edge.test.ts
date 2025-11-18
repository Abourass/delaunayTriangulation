import { describe, it, expect } from 'vitest';
import { Point } from '../Point';
import { Edge } from '../Edge';

describe('Edge', () => {
  describe('constructor', () => {
    it('should create an edge with two points', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const edge = new Edge(p1, p2);
      expect(edge.p1).toBe(p1);
      expect(edge.p2).toBe(p2);
    });
  });

  describe('equals', () => {
    it('should return true for edges with same endpoints (same order)', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const e1 = new Edge(p1, p2);
      const e2 = new Edge(p1, p2);
      expect(e1.equals(e2)).toBe(true);
    });

    it('should return true for edges with same endpoints (reversed order)', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const e1 = new Edge(p1, p2);
      const e2 = new Edge(p2, p1);
      expect(e1.equals(e2)).toBe(true);
    });

    it('should return false for edges with different endpoints', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const p3 = new Point(0, 10);
      const e1 = new Edge(p1, p2);
      const e2 = new Edge(p1, p3);
      expect(e1.equals(e2)).toBe(false);
    });
  });

  describe('sharesEndpointWith', () => {
    it('should return true when edges share an endpoint', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const p3 = new Point(0, 10);
      const e1 = new Edge(p1, p2);
      const e2 = new Edge(p1, p3);
      expect(e1.sharesEndpointWith(e2)).toBe(true);
    });

    it('should return false when edges do not share an endpoint', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const p3 = new Point(0, 10);
      const p4 = new Point(10, 10);
      const e1 = new Edge(p1, p2);
      const e2 = new Edge(p3, p4);
      expect(e1.sharesEndpointWith(e2)).toBe(false);
    });
  });

  describe('getLength', () => {
    it('should calculate edge length', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(3, 4);
      const edge = new Edge(p1, p2);
      expect(edge.getLength()).toBe(5);
    });

    it('should return 0 for zero-length edge', () => {
      const p1 = new Point(5, 5);
      const p2 = new Point(5, 5);
      const edge = new Edge(p1, p2);
      expect(edge.getLength()).toBe(0);
    });
  });

  describe('getLengthSquared', () => {
    it('should calculate squared edge length', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(3, 4);
      const edge = new Edge(p1, p2);
      expect(edge.getLengthSquared()).toBe(25);
    });
  });

  describe('getMidpoint', () => {
    it('should calculate midpoint of edge', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 10);
      const edge = new Edge(p1, p2);
      const mid = edge.getMidpoint();
      expect(mid.x).toBe(5);
      expect(mid.y).toBe(5);
    });
  });

  describe('getInterpolatedPoints', () => {
    it('should generate points along the edge', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const edge = new Edge(p1, p2);
      const points = edge.getInterpolatedPoints(3);
      expect(points).toHaveLength(3);
      expect(points[0].x).toBeCloseTo(2.5);
      expect(points[1].x).toBeCloseTo(5);
      expect(points[2].x).toBeCloseTo(7.5);
    });
  });

  describe('toArray', () => {
    it('should convert edge to array', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const edge = new Edge(p1, p2);
      const arr = edge.toArray();
      expect(arr).toHaveLength(2);
      expect(arr[0]).toBe(p1);
      expect(arr[1]).toBe(p2);
    });
  });

  describe('static fromArray', () => {
    it('should create edge from array', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const edge = Edge.fromArray([p1, p2]);
      expect(edge.p1).toBe(p1);
      expect(edge.p2).toBe(p2);
    });
  });
});
