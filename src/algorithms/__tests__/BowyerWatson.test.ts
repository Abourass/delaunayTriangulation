import { describe, it, expect } from 'vitest';
import { Point } from '../../core/Point';
import { Triangle } from '../../core/Triangle';
import { BowyerWatson } from '../BowyerWatson';

describe('BowyerWatson', () => {
  describe('triangulate', () => {
    it('should triangulate 3 points into 1 triangle', () => {
      const points = [
        new Point(10, 10),
        new Point(50, 10),
        new Point(30, 50)
      ];
      const superTri = new Triangle(
        new Point(-100, 200),
        new Point(200, 200),
        new Point(50, -200)
      );
      const result = BowyerWatson.triangulate(points, superTri);
      expect(result).toHaveLength(1);
    });

    it('should triangulate 4 points into 2 triangles', () => {
      const points = [
        new Point(0, 0),
        new Point(10, 0),
        new Point(10, 10),
        new Point(0, 10)
      ];
      const superTri = new Triangle(
        new Point(-100, 200),
        new Point(200, 200),
        new Point(50, -200)
      );
      const result = BowyerWatson.triangulate(points, superTri);
      expect(result).toHaveLength(2);
    });

    it('should create valid triangles with positive area', () => {
      const points = [
        new Point(10, 10),
        new Point(50, 10),
        new Point(30, 50),
        new Point(70, 50),
        new Point(40, 80)
      ];
      const superTri = new Triangle(
        new Point(-100, 200),
        new Point(200, 200),
        new Point(50, -200)
      );
      const result = BowyerWatson.triangulate(points, superTri);

      for (const tri of result) {
        expect(tri.getVertices()).toHaveLength(3);
        expect(tri.getEdges()).toHaveLength(3);
        expect(tri.getArea()).toBeGreaterThan(0);
      }
    });

    it('should accept width and height parameters', () => {
      const points = [
        new Point(10, 10),
        new Point(50, 10),
        new Point(30, 50)
      ];
      const result = BowyerWatson.triangulate(points, 800, 600);
      expect(result).toHaveLength(1);
    });

    it('should throw error when height is missing with width', () => {
      const points = [new Point(10, 10)];
      expect(() => {
        // @ts-expect-error - Testing error case
        BowyerWatson.triangulate(points, 800);
      }).toThrow('Height must be provided when calling with width');
    });
  });

  describe('createSuperTriangle', () => {
    it('should create a super triangle containing all points', () => {
      const points = [
        new Point(10, 10),
        new Point(50, 10),
        new Point(30, 50)
      ];
      const superTri = BowyerWatson.createSuperTriangle(points);

      for (const point of points) {
        expect(superTri.containsPoint(point)).toBe(true);
      }
    });

    it('should create a super triangle for canvas dimensions', () => {
      const points = [
        new Point(10, 10),
        new Point(50, 10),
        new Point(30, 50)
      ];
      const width = 800;
      const height = 600;
      const superTri = BowyerWatson.createSuperTriangle(points, width, height);

      // Super triangle should be much larger than the canvas
      const vertices = superTri.getVertices();
      let hasVertexOutsideCanvas = false;
      for (const v of vertices) {
        if (v.x < 0 || v.x > width || v.y < 0 || v.y > height) {
          hasVertexOutsideCanvas = true;
          break;
        }
      }
      expect(hasVertexOutsideCanvas).toBe(true);
    });

    it('should throw error for empty point set', () => {
      expect(() => {
        BowyerWatson.createSuperTriangle([]);
      }).toThrow('Cannot create super triangle for empty point set');
    });
  });

  describe('findBadTriangles', () => {
    it('should find triangles whose circumcircle contains the point', () => {
      const points = [
        new Point(0, 0),
        new Point(10, 0),
        new Point(5, 10)
      ];
      const tri = new Triangle(points[0], points[1], points[2]);
      const triangulation = [tri];
      const testPoint = tri.getCentroid(); // Centroid is definitely inside

      const badTriangles = BowyerWatson.findBadTriangles(triangulation, testPoint);
      expect(badTriangles).toHaveLength(1);
      expect(badTriangles[0]).toBe(tri);
    });

    it('should return empty array when no triangles contain the point', () => {
      const points = [
        new Point(0, 0),
        new Point(10, 0),
        new Point(5, 10)
      ];
      const tri = new Triangle(points[0], points[1], points[2]);
      const triangulation = [tri];
      const testPoint = new Point(1000, 1000); // Far away

      const badTriangles = BowyerWatson.findBadTriangles(triangulation, testPoint);
      expect(badTriangles).toHaveLength(0);
    });
  });

  describe('findBoundaryPolygon', () => {
    it('should find boundary edges of a single triangle', () => {
      const tri = new Triangle(
        new Point(0, 0),
        new Point(10, 0),
        new Point(5, 10)
      );
      const polygon = BowyerWatson.findBoundaryPolygon([tri]);
      expect(polygon).toHaveLength(3); // All 3 edges are on the boundary
    });

    it('should exclude shared edges from boundary', () => {
      const p1 = new Point(0, 0);
      const p2 = new Point(10, 0);
      const p3 = new Point(5, 10);
      const p4 = new Point(5, -10);

      const tri1 = new Triangle(p1, p2, p3);
      const tri2 = new Triangle(p1, p2, p4);

      const polygon = BowyerWatson.findBoundaryPolygon([tri1, tri2]);
      // Should have 4 edges (the two triangles share one edge p1-p2)
      expect(polygon).toHaveLength(4);
    });
  });

  describe('Delaunay property', () => {
    it('should satisfy Delaunay property - no point in any circumcircle', () => {
      const points = [
        new Point(10, 10),
        new Point(50, 10),
        new Point(50, 50),
        new Point(10, 50),
        new Point(30, 30)
      ];

      const triangles = BowyerWatson.triangulate(points, 800, 600);

      // Check that no point lies inside any triangle's circumcircle (except its own vertices)
      for (const triangle of triangles) {
        for (const point of points) {
          if (!triangle.hasVertex(point)) {
            expect(triangle.containsPointInCircumcircle(point)).toBe(false);
          }
        }
      }
    });
  });
});
