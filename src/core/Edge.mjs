import { Point } from './Point.mjs';

/**
 * Represents an edge (line segment) between two points.
 * Edges are undirected - (a, b) equals (b, a).
 */
export class Edge {
  /**
   * Create an edge between two points
   * @param {Point} p1 - First endpoint
   * @param {Point} p2 - Second endpoint
   */
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  /**
   * Check if this edge equals another edge (order-independent)
   * @param {Edge} edge - The edge to compare
   * @returns {boolean} True if edges have the same endpoints
   */
  equals(edge) {
    return (
      (this.p1.equals(edge.p1) && this.p2.equals(edge.p2)) ||
      (this.p1.equals(edge.p2) && this.p2.equals(edge.p1))
    );
  }

  /**
   * Check if this edge shares an endpoint with another edge
   * @param {Edge} edge - The edge to compare
   * @returns {boolean} True if edges share at least one endpoint
   */
  sharesEndpointWith(edge) {
    return (
      this.p1.equals(edge.p1) ||
      this.p1.equals(edge.p2) ||
      this.p2.equals(edge.p1) ||
      this.p2.equals(edge.p2)
    );
  }

  /**
   * Get the length of this edge
   * @returns {number} The length
   */
  getLength() {
    return this.p1.distanceTo(this.p2);
  }

  /**
   * Get the squared length of this edge (faster than getLength)
   * @returns {number} The squared length
   */
  getLengthSquared() {
    return this.p1.distanceToSquared(this.p2);
  }

  /**
   * Get the midpoint of this edge
   * @returns {Point} The midpoint
   */
  getMidpoint() {
    return this.p1.add(this.p2).div(2);
  }

  /**
   * Get points along this edge at regular intervals
   * @param {number} count - Number of points to generate (excluding endpoints)
   * @returns {Point[]} Array of points along the edge
   */
  getInterpolatedPoints(count) {
    const points = [];
    const delta = this.p2.sub(this.p1).div(count + 1);
    for (let i = 1; i <= count; i++) {
      points.push(this.p1.add(delta.mult(i)));
    }
    return points;
  }

  /**
   * Create a string representation of this edge
   * @returns {string} String representation
   */
  toString() {
    return `Edge(${this.p1.toString()} -> ${this.p2.toString()})`;
  }

  /**
   * Convert to array format [p1, p2]
   * @returns {Point[]} Array of two points
   */
  toArray() {
    return [this.p1, this.p2];
  }

  /**
   * Create an Edge from an array of two points
   * @param {Point[]} arr - Array containing two points
   * @returns {Edge} A new Edge
   */
  static fromArray(arr) {
    return new Edge(arr[0], arr[1]);
  }
}

export default Edge;
