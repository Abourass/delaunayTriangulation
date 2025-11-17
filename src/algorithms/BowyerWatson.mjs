import { Triangle } from '../core/Triangle.mjs';
import { Edge } from '../core/Edge.mjs';

/**
 * Bowyer-Watson algorithm for Delaunay triangulation.
 *
 * This is an incremental algorithm that adds points one at a time,
 * maintaining the Delaunay property throughout.
 *
 * @see https://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm
 */
export class BowyerWatson {
  /**
   * Perform Delaunay triangulation on a set of points
   * @param {Point[]} points - The points to triangulate
   * @param {Triangle} superTriangle - A triangle that contains all points
   * @returns {Triangle[]} Array of triangles forming the Delaunay triangulation
   */
  static triangulate(points, superTriangle) {
    const triangulation = [superTriangle];

    // Add each point incrementally
    for (const point of points) {
      this.addPoint(triangulation, point);
    }

    // Remove triangles connected to super triangle
    this.removeSuperTriangleVertices(triangulation, superTriangle);

    return triangulation;
  }

  /**
   * Add a single point to the triangulation
   * @param {Triangle[]} triangulation - The current triangulation
   * @param {Point} point - The point to add
   */
  static addPoint(triangulation, point) {
    // Find all triangles whose circumcircle contains the point
    const badTriangles = this.findBadTriangles(triangulation, point);

    // Find the boundary polygon of the hole created by removing bad triangles
    const polygon = this.findBoundaryPolygon(badTriangles);

    // Remove bad triangles from triangulation
    this.removeTriangles(triangulation, badTriangles);

    // Re-triangulate the hole by connecting boundary edges to the new point
    this.retriangulateHole(triangulation, polygon, point);
  }

  /**
   * Find all triangles whose circumcircle contains the given point
   * @param {Triangle[]} triangulation - The current triangulation
   * @param {Point} point - The point to check
   * @returns {Triangle[]} Array of "bad" triangles
   */
  static findBadTriangles(triangulation, point) {
    return triangulation.filter(triangle =>
      triangle.containsPointInCircumcircle(point)
    );
  }

  /**
   * Find the boundary polygon of a set of triangles
   * The boundary consists of edges that are not shared by any other triangle
   * @param {Triangle[]} triangles - The triangles to find the boundary of
   * @returns {Edge[]} Array of boundary edges
   */
  static findBoundaryPolygon(triangles) {
    const polygon = [];

    for (const triangle of triangles) {
      for (const edge of triangle.getEdges()) {
        const isShared = triangles.some(
          other => other !== triangle && other.hasEdge(edge)
        );

        if (!isShared) {
          polygon.push(edge);
        }
      }
    }

    return polygon;
  }

  /**
   * Remove a set of triangles from the triangulation
   * @param {Triangle[]} triangulation - The triangulation to modify
   * @param {Triangle[]} trianglesToRemove - The triangles to remove
   */
  static removeTriangles(triangulation, trianglesToRemove) {
    for (const triangle of trianglesToRemove) {
      const index = triangulation.indexOf(triangle);
      if (index > -1) {
        triangulation.splice(index, 1);
      }
    }
  }

  /**
   * Re-triangulate the hole by connecting boundary edges to a point
   * @param {Triangle[]} triangulation - The triangulation to modify
   * @param {Edge[]} polygon - The boundary polygon edges
   * @param {Point} point - The point to connect edges to
   */
  static retriangulateHole(triangulation, polygon, point) {
    for (const edge of polygon) {
      const newTriangle = new Triangle(edge.p1, edge.p2, point);
      triangulation.push(newTriangle);
    }
  }

  /**
   * Remove all triangles that share a vertex with the super triangle
   * @param {Triangle[]} triangulation - The triangulation to clean
   * @param {Triangle} superTriangle - The super triangle
   */
  static removeSuperTriangleVertices(triangulation, superTriangle) {
    let i = triangulation.length;
    while (i--) {
      if (triangulation[i].sharesVertexWith(superTriangle)) {
        triangulation.splice(i, 1);
      }
    }
  }

  /**
   * Create a super triangle that contains all given points
   * The super triangle should be large enough to encompass all points
   * @param {Point[]} points - The points to contain
   * @param {number} margin - Extra margin multiplier (default: 2)
   * @returns {Triangle} A super triangle
   */
  static createSuperTriangle(points, margin = 2) {
    if (points.length === 0) {
      throw new Error('Cannot create super triangle for empty point set');
    }

    // Find bounding box
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Create a triangle large enough to contain the bounding box
    const size = Math.max(width, height) * margin;

    const Point = points[0].constructor;
    return new Triangle(
      new Point(centerX - size * 2, centerY + size),
      new Point(centerX + size * 2, centerY + size),
      new Point(centerX, centerY - size * 2)
    );
  }
}

export default BowyerWatson;
