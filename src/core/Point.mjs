/**
 * Represents a 2D point/vector with mathematical operations.
 * This is the fundamental geometric primitive for the triangulation system.
 */
export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Add another point/vector to this one (immutable)
   * @param {Point} point - The point to add
   * @returns {Point} A new Point representing the sum
   */
  add(point) {
    return new Point(this.x + point.x, this.y + point.y);
  }

  /**
   * Subtract another point/vector from this one (immutable)
   * @param {Point} point - The point to subtract
   * @returns {Point} A new Point representing the difference
   */
  sub(point) {
    return new Point(this.x - point.x, this.y - point.y);
  }

  /**
   * Multiply this point by a scalar (immutable)
   * @param {number} n - The scalar multiplier
   * @returns {Point} A new Point representing the product
   */
  mult(n) {
    return new Point(this.x * n, this.y * n);
  }

  /**
   * Divide this point by a scalar (immutable)
   * @param {number} n - The scalar divisor
   * @returns {Point} A new Point representing the quotient
   */
  div(n) {
    return new Point(this.x / n, this.y / n);
  }

  /**
   * Get the Euclidean distance to another point
   * @param {Point} point - The target point
   * @returns {number} The distance
   */
  distanceTo(point) {
    return this.sub(point).getLength();
  }

  /**
   * Get the squared distance to another point (faster than distanceTo)
   * @param {Point} point - The target point
   * @returns {number} The squared distance
   */
  distanceToSquared(point) {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return dx * dx + dy * dy;
  }

  /**
   * Get the length/magnitude of this vector
   * @returns {number} The length
   */
  getLength() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Get the squared length (faster than getLength)
   * @returns {number} The squared length
   */
  getLengthSquared() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Get the angle of this vector in radians
   * @returns {number} The angle in radians
   */
  getAngle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Create a copy of this point
   * @returns {Point} A new Point with the same coordinates
   */
  copy() {
    return new Point(this.x, this.y);
  }

  /**
   * Check if this point equals another point
   * @param {Point} point - The point to compare
   * @returns {boolean} True if coordinates are equal
   */
  equals(point) {
    return this.x === point.x && this.y === point.y;
  }

  /**
   * Check if this point is approximately equal to another (within epsilon)
   * @param {Point} point - The point to compare
   * @param {number} epsilon - The tolerance (default: 1e-10)
   * @returns {boolean} True if coordinates are within epsilon
   */
  approximatelyEquals(point, epsilon = 1e-10) {
    return Math.abs(this.x - point.x) < epsilon && Math.abs(this.y - point.y) < epsilon;
  }

  /**
   * Create a string representation of this point
   * @returns {string} String representation
   */
  toString() {
    return `Point(${this.x}, ${this.y})`;
  }

  /**
   * Create a Point from polar coordinates
   * @param {number} angle - The angle in radians
   * @param {number} length - The magnitude
   * @returns {Point} A new Point
   */
  static fromPolar(angle, length) {
    return new Point(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  /**
   * Create a zero point
   * @returns {Point} A new Point at origin
   */
  static zero() {
    return new Point(0, 0);
  }
}

export default Point;
