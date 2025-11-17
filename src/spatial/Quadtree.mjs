import { Point } from '../core/Point.mjs';

/**
 * Rectangle bounds for quadtree regions
 */
export class Bounds {
  /**
   * @param {number} x - Left coordinate
   * @param {number} y - Top coordinate
   * @param {number} width - Width of bounds
   * @param {number} height - Height of bounds
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Check if a point is within these bounds
   * @param {Point} point - The point to check
   * @returns {boolean} True if point is inside
   */
  contains(point) {
    return (
      point.x >= this.x &&
      point.x < this.x + this.width &&
      point.y >= this.y &&
      point.y < this.y + this.height
    );
  }

  /**
   * Check if these bounds intersect with another bounds
   * @param {Bounds} other - The other bounds
   * @returns {boolean} True if they intersect
   */
  intersects(other) {
    return !(
      other.x > this.x + this.width ||
      other.x + other.width < this.x ||
      other.y > this.y + this.height ||
      other.y + other.height < this.y
    );
  }

  /**
   * Check if these bounds intersect with a circle
   * @param {number} cx - Circle center x
   * @param {number} cy - Circle center y
   * @param {number} radius - Circle radius
   * @returns {boolean} True if they intersect
   */
  intersectsCircle(cx, cy, radius) {
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
  /**
   * @param {Bounds} bounds - The bounds of this node
   * @param {number} [capacity=4] - Max points before subdivision
   * @param {number} [maxDepth=8] - Maximum tree depth
   * @param {number} [depth=0] - Current depth
   */
  constructor(bounds, capacity = 4, maxDepth = 8, depth = 0) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.depth = depth;
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  /**
   * Subdivide this node into four children
   */
  subdivide() {
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
   * @param {Point} point - The point to insert
   * @returns {boolean} True if successfully inserted
   */
  insert(point) {
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

    if (this.northwest.insert(point)) return true;
    if (this.northeast.insert(point)) return true;
    if (this.southwest.insert(point)) return true;
    if (this.southeast.insert(point)) return true;

    // Shouldn't reach here, but fallback to adding to current node
    this.points.push(point);
    return true;
  }

  /**
   * Query all points within a rectangular range
   * @param {Bounds} range - The query range
   * @param {Point[]} [found] - Array to collect found points
   * @returns {Point[]} Points within the range
   */
  queryRange(range, found = []) {
    if (!this.bounds.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      if (range.contains(point)) {
        found.push(point);
      }
    }

    if (this.divided) {
      this.northwest.queryRange(range, found);
      this.northeast.queryRange(range, found);
      this.southwest.queryRange(range, found);
      this.southeast.queryRange(range, found);
    }

    return found;
  }

  /**
   * Query all points within a circular range
   * @param {number} cx - Center x coordinate
   * @param {number} cy - Center y coordinate
   * @param {number} radius - Search radius
   * @param {Point[]} [found] - Array to collect found points
   * @returns {Point[]} Points within the circular range
   */
  queryCircle(cx, cy, radius, found = []) {
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
      this.northwest.queryCircle(cx, cy, radius, found);
      this.northeast.queryCircle(cx, cy, radius, found);
      this.southwest.queryCircle(cx, cy, radius, found);
      this.southeast.queryCircle(cx, cy, radius, found);
    }

    return found;
  }

  /**
   * Find the nearest point to a given location
   * @param {number} x - Query x coordinate
   * @param {number} y - Query y coordinate
   * @param {number} [maxDistance=Infinity] - Maximum search distance
   * @returns {Point|null} Nearest point or null if none found
   */
  findNearest(x, y, maxDistance = Infinity) {
    let nearest = null;
    let nearestDistSquared = maxDistance * maxDistance;

    const search = (node) => {
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
        const children = [node.northwest, node.northeast, node.southwest, node.southeast];
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
   * @param {number} x - Point x coordinate
   * @param {number} y - Point y coordinate
   * @param {Bounds} bounds - The bounds
   * @returns {number} Squared distance
   */
  distToBounds(x, y, bounds) {
    const closestX = Math.max(bounds.x, Math.min(x, bounds.x + bounds.width));
    const closestY = Math.max(bounds.y, Math.min(y, bounds.y + bounds.height));
    const dx = x - closestX;
    const dy = y - closestY;
    return dx * dx + dy * dy;
  }

  /**
   * Get all points in the quadtree
   * @returns {Point[]} All points
   */
  getAllPoints() {
    const allPoints = [...this.points];

    if (this.divided) {
      allPoints.push(...this.northwest.getAllPoints());
      allPoints.push(...this.northeast.getAllPoints());
      allPoints.push(...this.southwest.getAllPoints());
      allPoints.push(...this.southeast.getAllPoints());
    }

    return allPoints;
  }

  /**
   * Get count of all points in the quadtree
   * @returns {number} Total point count
   */
  size() {
    let count = this.points.length;

    if (this.divided) {
      count += this.northwest.size();
      count += this.northeast.size();
      count += this.southwest.size();
      count += this.southeast.size();
    }

    return count;
  }

  /**
   * Clear all points from the quadtree
   */
  clear() {
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  /**
   * Create a quadtree from an array of points
   * @param {Point[]} points - Points to insert
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} [capacity=4] - Node capacity
   * @returns {Quadtree} New quadtree containing all points
   */
  static fromPoints(points, width, height, capacity = 4) {
    const bounds = new Bounds(0, 0, width, height);
    const tree = new Quadtree(bounds, capacity);

    for (const point of points) {
      tree.insert(point);
    }

    return tree;
  }
}

export default Quadtree;
