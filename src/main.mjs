/**
 * Main entry point for the Delaunay Triangulation application.
 * This module bootstraps the application with default configuration.
 */
import { DelaunayApp } from './app/DelaunayApp.mjs';

// Wait for DOM to be ready
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(() => {
  const canvas = document.querySelector('#canvas');

  if (!canvas) {
    console.error('Canvas element with id "canvas" not found');
    return;
  }

  // Create and setup the application
  const app = new DelaunayApp({
    canvas,
    autoResize: true,
    clickToRedraw: true,
    // Optional: customize point generation
    // pointGeneratorOptions: { count: 50 }
    // Optional: customize rendering
    // renderOptions: { strokeStyle: '#333', lineWidth: 2 }
  });

  app.setup();

  // Expose app to window for debugging/experimentation
  window.delaunayApp = app;

  console.log('Delaunay Triangulation app initialized');
  console.log('Access the app via window.delaunayApp');
  console.log('Try: delaunayApp.setPointGeneratorByName("grid"); delaunayApp.draw()');
});
