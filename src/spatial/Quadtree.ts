import { Point } from '../core/Point';

/**
 * Rectangle bounds for quadtree regions
 */
export class Bounds {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  /**
   * @param x - Left coordinate
   * @param y - Top coordinate
   * @param width - Width of bounds
   * @param height - Height of bounds
   */
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Check if a point is within these bounds
   * @param point - The point to check
   * @returns True if point is inside
   */
  contains(point: Point): boolean {
    return (
      point.x >= this.x &&
      point.x < this.x + this.width &&
      point.y >= this.y &&
      point.y < this.y + this.height
    );
  }

  /**
   * Check if these bounds intersect with another bounds
   * @param other - The other bounds
   * @returns True if they intersect
   */
  intersects(other: Bounds): boolean {
    return !(
      other.x > this.x + this.width ||
      other.x + other.width < this.x ||
      other.y > this.y + this.height ||
      other.y + other.height < this.y
    );
  }

  /**
   * Check if these bounds intersect with a circle
   * @param cx - Circle center x
   * @param cy - Circle center y
   * @param radius - Circle radius
   * @returns True if they intersect
   */
  intersectsCircle(cx: number, cy: number, radius: number): boolean {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(this.x, Math.min(cx, this.x + this.width));
    const closestY = Math.max(this.y, Math.min(cy, this.y + this.height));

    // Calculate distance from closest point to circle center
    const distX = cx - closestX;
    const distY = cy - closestY;
    const distSquared = distX * distX + distY * distY;

    return distSquared <= radius * radius;
  }
}

/**
 * Quadtree data structure for spatial indexing of points
 * Enables O(log n) point queries instead of O(n)
 */
export class Quadtree {
  private bounds: Bounds;
  private capacity: number;
  private maxDepth: number;
  private depth: number;
  private points: Point[] = [];
  private divided: boolean = false;
  private northwest: Quadtree | null = null;
  private northeast: Quadtree | null = null;
  private southwest: Quadtree | null = null;
  private southeast: Quadtree | null = null;

  /**
   * @param bounds - The bounds of this node
   * @param capacity - Max points before subdivision
   * @param maxDepth - Maximum tree depth
   * @param depth - Current depth
   */
  constructor(bounds: Bounds, capacity: number = 4, maxDepth: number = 8, depth: number = 0) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  /**
   * Subdivide this node into four children
   */
  private subdivide(): void {
    const { x, y, width, height } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const nwBounds = new Bounds(x, y, halfWidth, halfHeight);
    const neBounds = new Bounds(x + halfWidth, y, halfWidth, halfHeight);
    const swBounds = new Bounds(x, y + halfHeight, halfWidth, halfHeight);
    const seBounds = new Bounds(x + halfWidth, y + halfHeight, halfWidth, halfHeight);

    this.northwest = new Quadtree(nwBounds, this.capacity, this.maxDepth, this.depth + 1);
    this.northeast = new Quadtree(neBounds, this.capacity, this.maxDepth, this.depth + 1);
    this.southwest = new Quadtree(swBounds, this.capacity, this.maxDepth, this.depth + 1);
    this.southeast = new Quadtree(seBounds, this.capacity, this.maxDepth, this.depth + 1);

    this.divided = true;
  }

  /**
   * Insert a point into the quadtree
   * @param point - The point to insert
   * @returns True if successfully inserted
   */
  insert(point: Point): boolean {
    if (!this.bounds.contains(point)) {
      return false;
    }

    if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    if (this.northwest!.insert(point)) return true;
    if (this.northeast!.insert(point)) return true;
    if (this.southwest!.insert(point)) return true;
    if (this.southeast!.insert(point)) return true;

    // Shouldn't reach here, but fallback to adding to current node
    this.points.push(point);
    return true;
  }

  /**
   * Query all points within a rectangular range
   * @param range - The query range
   * @param found - Array to collect found points
   * @returns Points within the range
   */
  queryRange(range: Bounds, found: Point[] = []): Point[] {
    if (!this.bounds.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      if (range.contains(point)) {
        found.push(point);
      }
    }

    if (this.divided) {
      this.northwest!.queryRange(range, found);
      this.northeast!.queryRange(range, found);
      this.southwest!.queryRange(range, found);
      this.southeast!.queryRange(range, found);
    }

    return found;
  }

  /**
   * Query all points within a circular range
   * @param cx - Center x coordinate
   * @param cy - Center y coordinate
   * @param radius - Search radius
   * @param found - Array to collect found points
   * @returns Points within the circular range
   */
  queryCircle(cx: number, cy: number, radius: number, found: Point[] = []): Point[] {
    if (!this.bounds.intersectsCircle(cx, cy, radius)) {
      return found;
    }

    const radiusSquared = radius * radius;
    for (const point of this.points) {
      const dx = point.x - cx;
      const dy = point.y - cy;
      if (dx * dx + dy * dy <= radiusSquared) {
        found.push(point);
      }
    }

    if (this.divided) {
      this.northwest!.queryCircle(cx, cy, radius, found);
      this.northeast!.queryCircle(cx, cy, radius, found);
      this.southwest!.queryCircle(cx, cy, radius, found);
      this.southeast!.queryCircle(cx, cy, radius, found);
    }

    return found;
  }

  /**
   * Find the nearest point to a given location
   * @param x - Query x coordinate
   * @param y - Query y coordinate
   * @param maxDistance - Maximum search distance
   * @returns Nearest point or null if none found
   */
  findNearest(x: number, y: number, maxDistance: number = Infinity): Point | null {
    let nearest: Point | null = null;
    let nearestDistSquared = maxDistance * maxDistance;

    const search = (node: Quadtree | null): void => {
      if (!node || !node.bounds.intersectsCircle(x, y, Math.sqrt(nearestDistSquared))) {
        return;
      }

      for (const point of node.points) {
        const dx = point.x - x;
        const dy = point.y - y;
        const distSquared = dx * dx + dy * dy;
        if (distSquared < nearestDistSquared) {
          nearestDistSquared = distSquared;
          nearest = point;
        }
      }

      if (node.divided) {
        // Search children closest to query point first
        const children = [node.northwest!, node.northeast!, node.southwest!, node.southeast!];
        children.sort((a, b) => {
          const aDist = this.distToBounds(x, y, a.bounds);
          const bDist = this.distToBounds(x, y, b.bounds);
          return aDist - bDist;
        });

        for (const child of children) {
          search(child);
        }
      }
    };

    search(this);
    return nearest;
  }

  /**
   * Calculate squared distance from point to bounds
   * @param x - Point x coordinate
   * @param y - Point y coordinate
   * @param bounds - The bounds
   * @returns Squared distance
   */
  private distToBounds(x: number, y: number, bounds: Bounds): number {
    const closestX = Math.max(bounds.x, Math.min(x, bounds.x + bounds.width));
    const closestY = Math.max(bounds.y, Math.min(y, bounds.y + bounds.height));
    const dx = x - closestX;
    const dy = y - closestY;
    return dx * dx + dy * dy;
  }

  /**
   * Get all points in the quadtree
   * @returns All points
   */
  getAllPoints(): Point[] {
    const allPoints = [...this.points];

    if (this.divided) {
      allPoints.push(...this.northwest!.getAllPoints());
      allPoints.push(...this.northeast!.getAllPoints());
      allPoints.push(...this.southwest!.getAllPoints());
      allPoints.push(...this.southeast!.getAllPoints());
    }

    return allPoints;
  }

  /**
   * Get count of all points in the quadtree
   * @returns Total point count
   */
  size(): number {
    let count = this.points.length;

    if (this.divided) {
      count += this.northwest!.size();
      count += this.northeast!.size();
      count += this.southwest!.size();
      count += this.southeast!.size();
    }

    return count;
  }

  /**
   * Clear all points from the quadtree
   */
  clear(): void {
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  /**
   * Create a quadtree from an array of points
   * @param points - Points to insert
   * @param width - Canvas width
   * @param height - Canvas height
   * @param capacity - Node capacity
   * @returns New quadtree containing all points
   */
  static fromPoints(points: Point[], width: number, height: number, capacity: number = 4): Quadtree {
    const bounds = new Bounds(0, 0, width, height);
    const tree = new Quadtree(bounds, capacity);

    for (const point of points) {
      tree.insert(point);
    }

    return tree;
  }
}

export default Quadtree;
