import { Component, createSignal } from 'solid-js';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { useTriangulation } from '../hooks/useTriangulation';

export const Canvas: Component = () => {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const { render } = useCanvasRenderer(canvasRef);
  const { regenerate } = useTriangulation();

  const handleCanvasClick = () => {
    regenerate();
  };

  return (
    <div class="canvas-container">
      <canvas
        ref={setCanvasRef}
        onClick={handleCanvasClick}
        class="triangulation-canvas"
      />
    </div>
  );
};
