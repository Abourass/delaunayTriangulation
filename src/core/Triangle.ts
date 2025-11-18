import { Point } from './Point';
import { Edge } from './Edge';

/**
 * Represents a triangle defined by three vertices.
 * Provides geometric operations without rendering concerns.
 */
export class Triangle {
  public a: Point;
  public b: Point;
  public c: Point;

  private _circumcenter: Point | null = null;
  private _circumradiusSquared: number | null = null;

  /**
   * Create a triangle from three points
   * @param a - First vertex
   * @param b - Second vertex
   * @param c - Third vertex
   */
  constructor(a: Point, b: Point, c: Point) {
    this.a = a;
    this.b = b;
    this.c = c;
  }

  /**
   * Get the vertices of this triangle
   * @returns Array of three vertices
   */
  getVertices(): Point[] {
    return [this.a, this.b, this.c];
  }

  /**
   * Get the edges of this triangle
   * @returns Array of three edges
   */
  getEdges(): Edge[] {
    return [
      new Edge(this.a, this.b),
      new Edge(this.b, this.c),
      new Edge(this.c, this.a)
    ];
  }

  /**
   * Check if this triangle shares any vertex with another triangle
   * @param triangle - The triangle to compare
   * @returns True if triangles share at least one vertex
   */
  sharesVertexWith(triangle: Triangle): boolean {
    const thisVertices = this.getVertices();
    const otherVertices = triangle.getVertices();

    for (const v1 of thisVertices) {
      for (const v2 of otherVertices) {
        if (v1.equals(v2)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if this triangle has a specific edge
   * @param edge - The edge to check
   * @returns True if triangle contains the edge
   */
  hasEdge(edge: Edge): boolean {
    const edges = this.getEdges();
    return edges.some(e => e.equals(edge));
  }

  /**
   * Check if this triangle contains a specific vertex
   * @param vertex - The vertex to check
   * @returns True if triangle contains the vertex
   */
  hasVertex(vertex: Point): boolean {
    return (
      this.a.equals(vertex) ||
      this.b.equals(vertex) ||
      this.c.equals(vertex)
    );
  }

  /**
   * Calculate the circumcenter of this triangle
   * The circumcenter is equidistant from all three vertices
   * @returns The circumcenter
   */
  getCircumcenter(): Point {
    if (this._circumcenter) {
      return this._circumcenter;
    }

    const d = 2 * (
      this.a.x * (this.b.y - this.c.y) +
      this.b.x * (this.c.y - this.a.y) +
      this.c.x * (this.a.y - this.b.y)
    );

    const ax2 = this.a.x * this.a.x + this.a.y * this.a.y;
    const bx2 = this.b.x * this.b.x + this.b.y * this.b.y;
    const cx2 = this.c.x * this.c.x + this.c.y * this.c.y;

    const x = (1 / d) * (
      ax2 * (this.b.y - this.c.y) +
      bx2 * (this.c.y - this.a.y) +
      cx2 * (this.a.y - this.b.y)
    );

    const y = (1 / d) * (
      ax2 * (this.c.x - this.b.x) +
      bx2 * (this.a.x - this.c.x) +
      cx2 * (this.b.x - this.a.x)
    );

    this._circumcenter = new Point(x, y);
    return this._circumcenter;
  }

  /**
   * Get the circumradius of this triangle
   * @returns The circumradius
   */
  getCircumradius(): number {
    return Math.sqrt(this.getCircumradiusSquared());
  }

  /**
   * Get the squared circumradius (faster than getCircumradius)
   * @returns The squared circumradius
   */
  getCircumradiusSquared(): number {
    if (this._circumradiusSquared !== null) {
      return this._circumradiusSquared;
    }

    const center = this.getCircumcenter();
    this._circumradiusSquared = center.distanceToSquared(this.a);
    return this._circumradiusSquared;
  }

  /**
   * Check if a point lies inside the circumcircle of this triangle
   * This is a key operation in Delaunay triangulation
   * @param point - The point to check
   * @returns True if point is inside circumcircle
   */
  containsPointInCircumcircle(point: Point): boolean {
    const center = this.getCircumcenter();
    const radiusSquared = this.getCircumradiusSquared();
    const distSquared = point.distanceToSquared(center);
    return distSquared < radiusSquared;
  }

  /**
   * Calculate the area of this triangle
   * @returns The area (positive)
   */
  getArea(): number {
    return Math.abs(
      (this.a.x * (this.b.y - this.c.y) +
       this.b.x * (this.c.y - this.a.y) +
       this.c.x * (this.a.y - this.b.y)) / 2
    );
  }

  /**
   * Calculate the centroid (center of mass) of this triangle
   * @returns The centroid
   */
  getCentroid(): Point {
    return new Point(
      (this.a.x + this.b.x + this.c.x) / 3,
      (this.a.y + this.b.y + this.c.y) / 3
    );
  }

  /**
   * Check if a point is inside this triangle
   * Uses barycentric coordinates
   * @param point - The point to check
   * @returns True if point is inside triangle
   */
  containsPoint(point: Point): boolean {
    const v0 = this.c.sub(this.a);
    const v1 = this.b.sub(this.a);
    const v2 = point.sub(this.a);

    const dot00 = v0.x * v0.x + v0.y * v0.y;
    const dot01 = v0.x * v1.x + v0.y * v1.y;
    const dot02 = v0.x * v2.x + v0.y * v2.y;
    const dot11 = v1.x * v1.x + v1.y * v1.y;
    const dot12 = v1.x * v2.x + v1.y * v2.y;

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return u >= 0 && v >= 0 && u + v <= 1;
  }

  /**
   * Invalidate cached circumcircle data
   * Call this if vertices are modified directly
   */
  invalidateCache(): void {
    this._circumcenter = null;
    this._circumradiusSquared = null;
  }

  /**
   * Create a string representation of this triangle
   * @returns String representation
   */
  toString(): string {
    return `Triangle(${this.a.toString()}, ${this.b.toString()}, ${this.c.toString()})`;
  }
}

export default Triangle;
