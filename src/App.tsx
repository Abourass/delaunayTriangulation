import { Component, onMount } from 'solid-js';
import { ControlPanel } from './components/ControlPanel';
import { Canvas } from './components/Canvas';
import { useTriangulation } from './hooks/useTriangulation';
import './styles.css';

const App: Component = () => {
  const { regenerate } = useTriangulation();

  onMount(() => {
    // Generate initial triangulation
    regenerate();
  });

  return (
    <div class="app">
      <ControlPanel />
      <main class="main-content">
        <Canvas />
      </main>
    </div>
  );
};

export default App;
