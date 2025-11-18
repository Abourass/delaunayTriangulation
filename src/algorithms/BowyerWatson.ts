import { Triangle } from '../core/Triangle';
import { Edge } from '../core/Edge';
import { Point } from '../core/Point';

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
   * @param points - The points to triangulate
   * @param superTriangleOrWidth - Either a super triangle or canvas width
   * @param height - Canvas height (only if second param is width)
   * @returns Array of triangles forming the Delaunay triangulation
   */
  static triangulate(points: Point[], superTriangleOrWidth: Triangle | number, height?: number): Triangle[] {
    // Support both calling patterns:
    // 1. triangulate(points, superTriangle) - original
    // 2. triangulate(points, width, height) - convenience method
    let superTriangle: Triangle;

    if (typeof superTriangleOrWidth === 'number') {
      // Called with width and height - create super triangle
      if (height === undefined) {
        throw new Error('Height must be provided when calling with width');
      }
      superTriangle = this.createSuperTriangle(points, superTriangleOrWidth, height);
    } else {
      // Called with explicit super triangle
      superTriangle = superTriangleOrWidth;
    }

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
   * @param triangulation - The current triangulation
   * @param point - The point to add
   */
  static addPoint(triangulation: Triangle[], point: Point): void {
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
   * @param triangulation - The current triangulation
   * @param point - The point to check
   * @returns Array of "bad" triangles
   */
  static findBadTriangles(triangulation: Triangle[], point: Point): Triangle[] {
    return triangulation.filter(triangle =>
      triangle.containsPointInCircumcircle(point)
    );
  }

  /**
   * Find the boundary polygon of a set of triangles
   * The boundary consists of edges that are not shared by any other triangle
   * @param triangles - The triangles to find the boundary of
   * @returns Array of boundary edges
   */
  static findBoundaryPolygon(triangles: Triangle[]): Edge[] {
    const polygon: Edge[] = [];

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
   * @param triangulation - The triangulation to modify
   * @param trianglesToRemove - The triangles to remove
   */
  static removeTriangles(triangulation: Triangle[], trianglesToRemove: Triangle[]): void {
    for (const triangle of trianglesToRemove) {
      const index = triangulation.indexOf(triangle);
      if (index > -1) {
        triangulation.splice(index, 1);
      }
    }
  }

  /**
   * Re-triangulate the hole by connecting boundary edges to a point
   * @param triangulation - The triangulation to modify
   * @param polygon - The boundary polygon edges
   * @param point - The point to connect edges to
   */
  static retriangulateHole(triangulation: Triangle[], polygon: Edge[], point: Point): void {
    for (const edge of polygon) {
      const newTriangle = new Triangle(edge.p1, edge.p2, point);
      triangulation.push(newTriangle);
    }
  }

  /**
   * Remove all triangles that share a vertex with the super triangle
   * @param triangulation - The triangulation to clean
   * @param superTriangle - The super triangle
   */
  static removeSuperTriangleVertices(triangulation: Triangle[], superTriangle: Triangle): void {
    let i = triangulation.length;
    while (i--) {
      if (triangulation[i].sharesVertexWith(superTriangle)) {
        triangulation.splice(i, 1);
      }
    }
  }

  /**
   * Create a super triangle that contains all given points or fills a canvas
   * @param points - The points to contain
   * @param widthOrMargin - Either canvas width or margin multiplier (default: 2)
   * @param height - Canvas height (only if widthOrMargin is width)
   * @returns A super triangle
   */
  static createSuperTriangle(points: Point[], widthOrMargin: number = 2, height?: number): Triangle {
    if (points.length === 0) {
      throw new Error('Cannot create super triangle for empty point set');
    }

    // Support both calling patterns:
    // 1. createSuperTriangle(points, margin) - original
    // 2. createSuperTriangle(points, width, height) - for canvas dimensions
    if (height !== undefined) {
      // Called with width and height - create super triangle for canvas
      const width = widthOrMargin;
      const margin = Math.max(width, height);

      return new Triangle(
        new Point(-margin, -margin),
        new Point(width + margin * 2, -margin),
        new Point(width / 2, height + margin * 2)
      );
    }

    // Original behavior - use margin multiplier
    const margin = widthOrMargin;

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

    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Create a triangle large enough to contain the bounding box
    const size = Math.max(boxWidth, boxHeight) * margin;

    return new Triangle(
      new Point(centerX - size * 2, centerY + size),
      new Point(centerX + size * 2, centerY + size),
      new Point(centerX, centerY - size * 2)
    );
  }
}

export default BowyerWatson;
