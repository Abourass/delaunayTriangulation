import { createStore } from 'solid-js/store';
import { Point, Triangle } from '../core/index';

export interface TriangulationState {
  // Generator settings
  selectedGenerator: string;
  pointCount: number;

  // Core data
  points: Point[];
  triangles: Triangle[];
  interactivePoints: Point[];

  // Canvas dimensions
  dimensions: { width: number; height: number };

  // Visualization options
  showCircumcircles: boolean;
  showVoronoi: boolean;
  showPoints: boolean;
  colorMode: string;
  lineWidth: number;
  strokeColor: string;
  backgroundColor: string;

  // Zoom and pan
  zoom: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  lastMousePos: { x: number; y: number };

  // Animation settings
  animationMode: string;
  animationRunning: boolean;

  // Tutorial mode
  tutorialMode: boolean;
  currentStep: number;
  isPlaying: boolean;
  playSpeed: number;
}

const initialState: TriangulationState = {
  selectedGenerator: 'random',
  pointCount: 50,
  points: [],
  triangles: [],
  interactivePoints: [],
  dimensions: { width: 0, height: 0 },
  showCircumcircles: false,
  showVoronoi: false,
  showPoints: false,
  colorMode: 'none',
  lineWidth: 2,
  strokeColor: '#000000',
  backgroundColor: '#ffffff',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  isPanning: false,
  lastMousePos: { x: 0, y: 0 },
  animationMode: 'none',
  animationRunning: false,
  tutorialMode: false,
  currentStep: 0,
  isPlaying: false,
  playSpeed: 1000,
};

export const [triangulationState, setTriangulationState] = createStore<TriangulationState>(initialState);
