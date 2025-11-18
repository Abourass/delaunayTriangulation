import { Component } from 'solid-js';
import { Collapsible } from '@kobalte/core/collapsible';
import { GeneratorControls } from './GeneratorControls';
import { VisualizationControls } from './VisualizationControls';
import { triangulationState } from '../stores/triangulationStore';

export const ControlPanel: Component = () => {
  return (
    <aside class="control-panel">
      <h2>Delaunay Triangulation</h2>

      <Collapsible defaultOpen={true} class="collapsible-section">
        <Collapsible.Trigger class="collapsible-trigger">
          Generator Settings ▼
        </Collapsible.Trigger>
        <Collapsible.Content class="collapsible-content">
          <GeneratorControls />
        </Collapsible.Content>
      </Collapsible>

      <Collapsible defaultOpen={true} class="collapsible-section">
        <Collapsible.Trigger class="collapsible-trigger">
          Visualization ▼
        </Collapsible.Trigger>
        <Collapsible.Content class="collapsible-content">
          <VisualizationControls />
        </Collapsible.Content>
      </Collapsible>

      <div class="stats">
        <h3>Statistics</h3>
        <div class="stat-item">
          <span class="stat-label">Points:</span>
          <span class="stat-value">{triangulationState.points.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Triangles:</span>
          <span class="stat-value">{triangulationState.triangles.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Canvas:</span>
          <span class="stat-value">
            {triangulationState.dimensions.width} × {triangulationState.dimensions.height}
          </span>
        </div>
      </div>
    </aside>
  );
};
