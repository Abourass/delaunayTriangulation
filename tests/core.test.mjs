/**
 * Unit tests for core geometry modules.
 * These tests demonstrate the improved testability of the refactored code.
 * Run with: node tests/core.test.mjs
 */

import { Point, Edge, Triangle } from '../src/core/index.mjs';
import { BowyerWatson } from '../src/algorithms/BowyerWatson.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`Expected truthy value. ${message}`);
  }
}

function assertFalse(value, message = '') {
  if (value) {
    throw new Error(`Expected falsy value. ${message}`);
  }
}

console.log('Running Point tests...');

test('Point creation', () => {
  const p = new Point(3, 4);
  assertEqual(p.x, 3);
  assertEqual(p.y, 4);
});

test('Point addition', () => {
  const p1 = new Point(1, 2);
  const p2 = new Point(3, 4);
  const result = p1.add(p2);
  assertEqual(result.x, 4);
  assertEqual(result.y, 6);
});

test('Point subtraction', () => {
  const p1 = new Point(5, 7);
  const p2 = new Point(2, 3);
  const result = p1.sub(p2);
  assertEqual(result.x, 3);
  assertEqual(result.y, 4);
});

test('Point getLength', () => {
  const p = new Point(3, 4);
  assertEqual(p.getLength(), 5);
});

test('Point equals', () => {
  const p1 = new Point(1, 2);
  const p2 = new Point(1, 2);
  const p3 = new Point(1, 3);
  assertTrue(p1.equals(p2));
  assertFalse(p1.equals(p3));
});

test('Point distanceTo', () => {
  const p1 = new Point(0, 0);
  const p2 = new Point(3, 4);
  assertEqual(p1.distanceTo(p2), 5);
});

console.log('\nRunning Edge tests...');

test('Edge creation', () => {
  const p1 = new Point(0, 0);
  const p2 = new Point(10, 0);
  const edge = new Edge(p1, p2);
  assertTrue(edge.p1.equals(p1));
  assertTrue(edge.p2.equals(p2));
});

test('Edge equality (same order)', () => {
  const p1 = new Point(0, 0);
  const p2 = new Point(10, 0);
  const e1 = new Edge(p1, p2);
  const e2 = new Edge(p1, p2);
  assertTrue(e1.equals(e2));
});

test('Edge equality (reversed order)', () => {
  const p1 = new Point(0, 0);
  const p2 = new Point(10, 0);
  const e1 = new Edge(p1, p2);
  const e2 = new Edge(p2, p1);
  assertTrue(e1.equals(e2));
});

test('Edge getLength', () => {
  const p1 = new Point(0, 0);
  const p2 = new Point(3, 4);
  const edge = new Edge(p1, p2);
  assertEqual(edge.getLength(), 5);
});

test('Edge getMidpoint', () => {
  const p1 = new Point(0, 0);
  const p2 = new Point(10, 10);
  const edge = new Edge(p1, p2);
  const mid = edge.getMidpoint();
  assertEqual(mid.x, 5);
  assertEqual(mid.y, 5);
});

console.log('\nRunning Triangle tests...');

test('Triangle creation', () => {
  const a = new Point(0, 0);
  const b = new Point(10, 0);
  const c = new Point(5, 10);
  const tri = new Triangle(a, b, c);
  assertTrue(tri.a.equals(a));
  assertTrue(tri.b.equals(b));
  assertTrue(tri.c.equals(c));
});

test('Triangle getVertices', () => {
  const a = new Point(0, 0);
  const b = new Point(10, 0);
  const c = new Point(5, 10);
  const tri = new Triangle(a, b, c);
  const vertices = tri.getVertices();
  assertEqual(vertices.length, 3);
  assertTrue(vertices[0].equals(a));
  assertTrue(vertices[1].equals(b));
  assertTrue(vertices[2].equals(c));
});

test('Triangle getEdges', () => {
  const a = new Point(0, 0);
  const b = new Point(10, 0);
  const c = new Point(5, 10);
  const tri = new Triangle(a, b, c);
  const edges = tri.getEdges();
  assertEqual(edges.length, 3);
});

test('Triangle hasVertex', () => {
  const a = new Point(0, 0);
  const b = new Point(10, 0);
  const c = new Point(5, 10);
  const tri = new Triangle(a, b, c);
  assertTrue(tri.hasVertex(a));
  assertTrue(tri.hasVertex(b));
  assertTrue(tri.hasVertex(c));
  assertFalse(tri.hasVertex(new Point(100, 100)));
});

test('Triangle getArea', () => {
  const a = new Point(0, 0);
  const b = new Point(10, 0);
  const c = new Point(5, 10);
  const tri = new Triangle(a, b, c);
  assertEqual(tri.getArea(), 50);
});

test('Triangle getCentroid', () => {
  const a = new Point(0, 0);
  const b = new Point(10, 0);
  const c = new Point(5, 10);
  const tri = new Triangle(a, b, c);
  const centroid = tri.getCentroid();
  assertEqual(centroid.x, 5);
  assertTrue(Math.abs(centroid.y - 10/3) < 0.001);
});

test('Triangle circumcenter calculation', () => {
  const a = new Point(0, 0);
  const b = new Point(10, 0);
  const c = new Point(5, 10);
  const tri = new Triangle(a, b, c);
  const center = tri.getCircumcenter();
  // All vertices should be equidistant from circumcenter
  const da = center.distanceTo(a);
  const db = center.distanceTo(b);
  const dc = center.distanceTo(c);
  assertTrue(Math.abs(da - db) < 0.001);
  assertTrue(Math.abs(db - dc) < 0.001);
});

test('Triangle containsPointInCircumcircle', () => {
  const a = new Point(0, 0);
  const b = new Point(10, 0);
  const c = new Point(5, 10);
  const tri = new Triangle(a, b, c);
  const center = tri.getCentroid();
  assertTrue(tri.containsPointInCircumcircle(center));
  assertFalse(tri.containsPointInCircumcircle(new Point(100, 100)));
});

console.log('\nRunning Bowyer-Watson tests...');

test('BowyerWatson triangulation with 3 points', () => {
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
  assertEqual(result.length, 1);
});

test('BowyerWatson triangulation with 4 points', () => {
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
  assertEqual(result.length, 2);
});

test('BowyerWatson all triangles have valid structure', () => {
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
    assertEqual(tri.getVertices().length, 3);
    assertEqual(tri.getEdges().length, 3);
    assertTrue(tri.getArea() > 0);
  }
});

console.log('\n-----------------------------------');
console.log(`Tests completed: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
