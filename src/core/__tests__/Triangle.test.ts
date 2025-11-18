import { describe, it, expect } from 'vitest';
import { Point } from '../Point';
import { Edge } from '../Edge';
import { Triangle } from '../Triangle';

describe('Triangle', () => {
  describe('constructor', () => {
    it('should create a triangle with three points', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      expect(tri.a).toBe(a);
      expect(tri.b).toBe(b);
      expect(tri.c).toBe(c);
    });
  });

  describe('getVertices', () => {
    it('should return all three vertices', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const vertices = tri.getVertices();
      expect(vertices).toHaveLength(3);
      expect(vertices[0]).toBe(a);
      expect(vertices[1]).toBe(b);
      expect(vertices[2]).toBe(c);
    });
  });

  describe('getEdges', () => {
    it('should return all three edges', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const edges = tri.getEdges();
      expect(edges).toHaveLength(3);
    });

    it('should return edges connecting the vertices', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const edges = tri.getEdges();

      const edge1 = new Edge(a, b);
      const edge2 = new Edge(b, c);
      const edge3 = new Edge(c, a);

      expect(edges.some(e => e.equals(edge1))).toBe(true);
      expect(edges.some(e => e.equals(edge2))).toBe(true);
      expect(edges.some(e => e.equals(edge3))).toBe(true);
    });
  });

  describe('hasVertex', () => {
    it('should return true for vertices in the triangle', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      expect(tri.hasVertex(a)).toBe(true);
      expect(tri.hasVertex(b)).toBe(true);
      expect(tri.hasVertex(c)).toBe(true);
    });

    it('should return false for vertices not in the triangle', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const d = new Point(100, 100);
      expect(tri.hasVertex(d)).toBe(false);
    });
  });

  describe('hasEdge', () => {
    it('should return true for edges in the triangle', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const edge = new Edge(a, b);
      expect(tri.hasEdge(edge)).toBe(true);
    });

    it('should return false for edges not in the triangle', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const d = new Point(100, 100);
      const tri = new Triangle(a, b, c);
      const edge = new Edge(a, d);
      expect(tri.hasEdge(edge)).toBe(false);
    });
  });

  describe('sharesVertexWith', () => {
    it('should return true for triangles sharing a vertex', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const d = new Point(15, 10);
      const tri1 = new Triangle(a, b, c);
      const tri2 = new Triangle(a, b, d);
      expect(tri1.sharesVertexWith(tri2)).toBe(true);
    });

    it('should return false for triangles not sharing a vertex', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const d = new Point(100, 100);
      const e = new Point(110, 100);
      const f = new Point(105, 110);
      const tri1 = new Triangle(a, b, c);
      const tri2 = new Triangle(d, e, f);
      expect(tri1.sharesVertexWith(tri2)).toBe(false);
    });
  });

  describe('getArea', () => {
    it('should calculate triangle area', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      expect(tri.getArea()).toBe(50);
    });

    it('should return positive area regardless of vertex order', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri1 = new Triangle(a, b, c);
      const tri2 = new Triangle(a, c, b);
      expect(tri1.getArea()).toBe(tri2.getArea());
      expect(tri1.getArea()).toBeGreaterThan(0);
    });
  });

  describe('getCentroid', () => {
    it('should calculate triangle centroid', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const centroid = tri.getCentroid();
      expect(centroid.x).toBe(5);
      expect(centroid.y).toBeCloseTo(10 / 3);
    });
  });

  describe('getCircumcenter', () => {
    it('should calculate circumcenter', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const center = tri.getCircumcenter();

      // All vertices should be equidistant from circumcenter
      const da = center.distanceTo(a);
      const db = center.distanceTo(b);
      const dc = center.distanceTo(c);

      expect(Math.abs(da - db)).toBeLessThan(0.001);
      expect(Math.abs(db - dc)).toBeLessThan(0.001);
    });

    it('should cache circumcenter', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const center1 = tri.getCircumcenter();
      const center2 = tri.getCircumcenter();
      expect(center1).toBe(center2); // Same reference
    });
  });

  describe('getCircumradius', () => {
    it('should calculate circumradius', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const radius = tri.getCircumradius();
      const center = tri.getCircumcenter();

      // Radius should equal distance from center to any vertex
      expect(Math.abs(radius - center.distanceTo(a))).toBeLessThan(0.001);
    });
  });

  describe('containsPointInCircumcircle', () => {
    it('should return true for points inside circumcircle', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const center = tri.getCentroid();
      expect(tri.containsPointInCircumcircle(center)).toBe(true);
    });

    it('should return false for points outside circumcircle', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const farPoint = new Point(100, 100);
      expect(tri.containsPointInCircumcircle(farPoint)).toBe(false);
    });
  });

  describe('containsPoint', () => {
    it('should return true for points inside triangle', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const inside = new Point(5, 5);
      expect(tri.containsPoint(inside)).toBe(true);
    });

    it('should return false for points outside triangle', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);
      const outside = new Point(100, 100);
      expect(tri.containsPoint(outside)).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should clear cached circumcircle data', () => {
      const a = new Point(0, 0);
      const b = new Point(10, 0);
      const c = new Point(5, 10);
      const tri = new Triangle(a, b, c);

      const center1 = tri.getCircumcenter();
      tri.invalidateCache();
      const center2 = tri.getCircumcenter();

      expect(center1).not.toBe(center2); // Different references
      expect(center1.equals(center2)).toBe(true); // But same values
    });
  });
});
