/**
 * Web Worker for off-thread Delaunay triangulation computation
 * Keeps the main thread responsive while processing large point sets
 */

import { Point, Triangle, Edge } from '../core/index.mjs';
import { BowyerWatson } from '../algorithms/BowyerWatson.mjs';

interface TriangulationRequest {
  type: 'triangulate';
  points: { x: number; y: number }[];
  width: number;
  height: number;
}

interface TriangulationResponse {
  type: 'triangulation_result';
  triangles: { p1: { x: number; y: number }; p2: { x: number; y: number }; p3: { x: number; y: number } }[];
  computationTime: number;
}

interface StepByStepRequest {
  type: 'generate_steps';
  points: { x: number; y: number }[];
  width: number;
  height: number;
}

interface AlgorithmStepData {
  type: 'add_point' | 'find_bad' | 'find_boundary' | 'remove_bad' | 'retriangulate' | 'cleanup';
  description: string;
  triangulation: { p1: { x: number; y: number }; p2: { x: number; y: number }; p3: { x: number; y: number } }[];
  badTriangles?: { p1: { x: number; y: number }; p2: { x: number; y: number }; p3: { x: number; y: number } }[];
  boundaryPolygon?: { p1: { x: number; y: number }; p2: { x: number; y: number } }[];
  currentPoint?: { x: number; y: number };
}

interface StepByStepResponse {
  type: 'steps_result';
  steps: AlgorithmStepData[];
  computationTime: number;
}

type WorkerRequest = TriangulationRequest | StepByStepRequest;
type WorkerResponse = TriangulationResponse | StepByStepResponse;

// Convert plain objects to Point instances
function toPoints(data: { x: number; y: number }[]): Point[] {
  return data.map((p) => new Point(p.x, p.y));
}

// Convert Triangle instances to plain objects for serialization
function serializeTriangles(triangles: Triangle[]): { p1: { x: number; y: number }; p2: { x: number; y: number }; p3: { x: number; y: number } }[] {
  return triangles.map((t) => ({
    p1: { x: t.p1.x, y: t.p1.y },
    p2: { x: t.p2.x, y: t.p2.y },
    p3: { x: t.p3.x, y: t.p3.y },
  }));
}

// Convert Edge instances to plain objects for serialization
function serializeEdges(edges: Edge[]): { p1: { x: number; y: number }; p2: { x: number; y: number } }[] {
  return edges.map((e) => ({
    p1: { x: e.p1.x, y: e.p1.y },
    p2: { x: e.p2.x, y: e.p2.y },
  }));
}

// Generate step-by-step algorithm breakdown
function generateSteps(points: Point[], width: number, height: number): AlgorithmStepData[] {
  const steps: AlgorithmStepData[] = [];
  const margin = Math.max(width, height) * 2;
  const superTriangle = new Triangle(
    new Point(-margin, -margin),
    new Point(width + margin * 2, -margin),
    new Point(width / 2, height + margin * 2)
  );

  let triangulation = [superTriangle];

  steps.push({
    type: 'add_point',
    description: 'Initialize with super-triangle that encompasses all points',
    triangulation: serializeTriangles(triangulation),
  });

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    steps.push({
      type: 'add_point',
      description: `Adding point ${i + 1} of ${points.length} at (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`,
      triangulation: serializeTriangles(triangulation),
      currentPoint: { x: point.x, y: point.y },
    });

    const badTriangles = triangulation.filter((t) => t.circumcircleContains(point));

    steps.push({
      type: 'find_bad',
      description: `Found ${badTriangles.length} triangle(s) whose circumcircle contains the new point`,
      triangulation: serializeTriangles(triangulation),
      badTriangles: serializeTriangles(badTriangles),
      currentPoint: { x: point.x, y: point.y },
    });

    const boundaryPolygon: Edge[] = [];
    for (const triangle of badTriangles) {
      const edges = triangle.getEdges();
      for (const edge of edges) {
        let isShared = false;
        for (const other of badTriangles) {
          if (triangle !== other && other.hasEdge(edge)) {
            isShared = true;
            break;
          }
        }
        if (!isShared) {
          boundaryPolygon.push(edge);
        }
      }
    }

    steps.push({
      type: 'find_boundary',
      description: `Identified boundary polygon with ${boundaryPolygon.length} edge(s)`,
      triangulation: serializeTriangles(triangulation),
      badTriangles: serializeTriangles(badTriangles),
      boundaryPolygon: serializeEdges(boundaryPolygon),
      currentPoint: { x: point.x, y: point.y },
    });

    triangulation = triangulation.filter((t) => !badTriangles.includes(t));

    steps.push({
      type: 'remove_bad',
      description: 'Removed bad triangles from triangulation',
      triangulation: serializeTriangles(triangulation),
      boundaryPolygon: serializeEdges(boundaryPolygon),
      currentPoint: { x: point.x, y: point.y },
    });

    for (const edge of boundaryPolygon) {
      triangulation.push(new Triangle(edge.p1, edge.p2, point));
    }

    steps.push({
      type: 'retriangulate',
      description: `Created ${boundaryPolygon.length} new triangle(s) connecting boundary to new point`,
      triangulation: serializeTriangles(triangulation),
      currentPoint: { x: point.x, y: point.y },
    });
  }

  triangulation = triangulation.filter((t) => !t.sharesVertex(superTriangle));

  steps.push({
    type: 'cleanup',
    description: 'Removed triangles connected to super-triangle vertices',
    triangulation: serializeTriangles(triangulation),
  });

  return steps;
}

// Handle incoming messages
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  const startTime = performance.now();

  if (request.type === 'triangulate') {
    const points = toPoints(request.points);
    const triangles = BowyerWatson.triangulate(points, request.width, request.height);
    const computationTime = performance.now() - startTime;

    const response: TriangulationResponse = {
      type: 'triangulation_result',
      triangles: serializeTriangles(triangles),
      computationTime,
    };

    self.postMessage(response);
  } else if (request.type === 'generate_steps') {
    const points = toPoints(request.points);
    const steps = generateSteps(points, request.width, request.height);
    const computationTime = performance.now() - startTime;

    const response: StepByStepResponse = {
      type: 'steps_result',
      steps,
      computationTime,
    };

    self.postMessage(response);
  }
};
