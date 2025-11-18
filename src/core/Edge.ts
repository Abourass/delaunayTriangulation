import { Point } from './Point';

/**
 * Represents an edge (line segment) between two points.
 * Edges are undirected - (a, b) equals (b, a).
 */
export class Edge {
  public p1: Point;
  public p2: Point;

  /**
   * Create an edge between two points
   * @param p1 - First endpoint
   * @param p2 - Second endpoint
   */
  constructor(p1: Point, p2: Point) {
    this.p1 = p1;
    this.p2 = p2;
  }

  /**
   * Check if this edge equals another edge (order-independent)
   * @param edge - The edge to compare
   * @returns True if edges have the same endpoints
   */
  equals(edge: Edge): boolean {
    return (
      (this.p1.equals(edge.p1) && this.p2.equals(edge.p2)) ||
      (this.p1.equals(edge.p2) && this.p2.equals(edge.p1))
    );
  }

  /**
   * Check if this edge shares an endpoint with another edge
   * @param edge - The edge to compare
   * @returns True if edges share at least one endpoint
   */
  sharesEndpointWith(edge: Edge): boolean {
    return (
      this.p1.equals(edge.p1) ||
      this.p1.equals(edge.p2) ||
      this.p2.equals(edge.p1) ||
      this.p2.equals(edge.p2)
    );
  }

  /**
   * Get the length of this edge
   * @returns The length
   */
  getLength(): number {
    return this.p1.distanceTo(this.p2);
  }

  /**
   * Get the squared length of this edge (faster than getLength)
   * @returns The squared length
   */
  getLengthSquared(): number {
    return this.p1.distanceToSquared(this.p2);
  }

  /**
   * Get the midpoint of this edge
   * @returns The midpoint
   */
  getMidpoint(): Point {
    return this.p1.add(this.p2).div(2);
  }

  /**
   * Get points along this edge at regular intervals
   * @param count - Number of points to generate (excluding endpoints)
   * @returns Array of points along the edge
   */
  getInterpolatedPoints(count: number): Point[] {
    const points: Point[] = [];
    const delta = this.p2.sub(this.p1).div(count + 1);
    for (let i = 1; i <= count; i++) {
      points.push(this.p1.add(delta.mult(i)));
    }
    return points;
  }

  /**
   * Create a string representation of this edge
   * @returns String representation
   */
  toString(): string {
    return `Edge(${this.p1.toString()} -> ${this.p2.toString()})`;
  }

  /**
   * Convert to array format [p1, p2]
   * @returns Array of two points
   */
  toArray(): Point[] {
    return [this.p1, this.p2];
  }

  /**
   * Create an Edge from an array of two points
   * @param arr - Array containing two points
   * @returns A new Edge
   */
  static fromArray(arr: Point[]): Edge {
    return new Edge(arr[0], arr[1]);
  }
}

export default Edge;
