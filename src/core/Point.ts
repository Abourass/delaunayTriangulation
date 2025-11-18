/**
 * Represents a 2D point/vector with mathematical operations.
 * This is the fundamental geometric primitive for the triangulation system.
 */
export class Point {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Add another point/vector to this one (immutable)
   * @param point - The point to add
   * @returns A new Point representing the sum
   */
  add(point: Point): Point {
    return new Point(this.x + point.x, this.y + point.y);
  }

  /**
   * Subtract another point/vector from this one (immutable)
   * @param point - The point to subtract
   * @returns A new Point representing the difference
   */
  sub(point: Point): Point {
    return new Point(this.x - point.x, this.y - point.y);
  }

  /**
   * Multiply this point by a scalar (immutable)
   * @param n - The scalar multiplier
   * @returns A new Point representing the product
   */
  mult(n: number): Point {
    return new Point(this.x * n, this.y * n);
  }

  /**
   * Divide this point by a scalar (immutable)
   * @param n - The scalar divisor
   * @returns A new Point representing the quotient
   */
  div(n: number): Point {
    return new Point(this.x / n, this.y / n);
  }

  /**
   * Get the Euclidean distance to another point
   * @param point - The target point
   * @returns The distance
   */
  distanceTo(point: Point): number {
    return this.sub(point).getLength();
  }

  /**
   * Get the squared distance to another point (faster than distanceTo)
   * @param point - The target point
   * @returns The squared distance
   */
  distanceToSquared(point: Point): number {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return dx * dx + dy * dy;
  }

  /**
   * Get the length/magnitude of this vector
   * @returns The length
   */
  getLength(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Get the squared length (faster than getLength)
   * @returns The squared length
   */
  getLengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Get the angle of this vector in radians
   * @returns The angle in radians
   */
  getAngle(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Create a copy of this point
   * @returns A new Point with the same coordinates
   */
  copy(): Point {
    return new Point(this.x, this.y);
  }

  /**
   * Check if this point equals another point
   * @param point - The point to compare
   * @returns True if coordinates are equal
   */
  equals(point: Point): boolean {
    return this.x === point.x && this.y === point.y;
  }

  /**
   * Check if this point is approximately equal to another (within epsilon)
   * @param point - The point to compare
   * @param epsilon - The tolerance (default: 1e-10)
   * @returns True if coordinates are within epsilon
   */
  approximatelyEquals(point: Point, epsilon: number = 1e-10): boolean {
    return Math.abs(this.x - point.x) < epsilon && Math.abs(this.y - point.y) < epsilon;
  }

  /**
   * Create a string representation of this point
   * @returns String representation
   */
  toString(): string {
    return `Point(${this.x}, ${this.y})`;
  }

  /**
   * Create a Point from polar coordinates
   * @param angle - The angle in radians
   * @param length - The magnitude
   * @returns A new Point
   */
  static fromPolar(angle: number, length: number): Point {
    return new Point(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  /**
   * Create a zero point
   * @returns A new Point at origin
   */
  static zero(): Point {
    return new Point(0, 0);
  }
}

export default Point;
