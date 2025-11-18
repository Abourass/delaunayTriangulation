import { Component } from 'solid-js';
import { ControlPanel } from './components/ControlPanel';
import { Canvas } from './components/Canvas';
import './styles.css';

const App: Component = () => {
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
