import { Component } from 'solid-js';
import { Select } from '@kobalte/core/select';
import { Slider } from '@kobalte/core/slider';
import { triangulationState, setTriangulationState } from '../stores/triangulationStore';

interface ColorModeOption {
  value: string;
  label: string;
}

const colorModeOptions: ColorModeOption[] = [
  { value: 'none', label: 'No Fill' },
  { value: 'area', label: 'By Area' },
  { value: 'aspect', label: 'By Aspect Ratio' },
  { value: 'random', label: 'Random Colors' },
];

export const VisualizationControls: Component = () => {
  return (
    <div class="control-group">
      <h3>Visualization Options</h3>

      <div class="control-item">
        <label>
          <input
            type="checkbox"
            checked={triangulationState.showPoints}
            onChange={(e) => setTriangulationState({ showPoints: e.target.checked })}
          />
          Show Points
        </label>
      </div>

      <div class="control-item">
        <label>
          <input
            type="checkbox"
            checked={triangulationState.showCircumcircles}
            onChange={(e) => setTriangulationState({ showCircumcircles: e.target.checked })}
          />
          Show Circumcircles
        </label>
      </div>

      <div class="control-item">
        <label>
          <input
            type="checkbox"
            checked={triangulationState.showVoronoi}
            onChange={(e) => setTriangulationState({ showVoronoi: e.target.checked })}
          />
          Show Voronoi Diagram
        </label>
      </div>

      <div class="control-item">
        <label>Color Mode:</label>
        <Select
          value={triangulationState.colorMode}
          onChange={(value) => setTriangulationState({ colorMode: value })}
          options={colorModeOptions}
          optionValue="value"
          optionTextValue="label"
          placeholder="Select color mode"
          itemComponent={(props) => (
            <Select.Item item={props.item} class="select__item">
              <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
              <Select.ItemIndicator class="select__item-indicator">✓</Select.ItemIndicator>
            </Select.Item>
          )}
        >
          <Select.Trigger class="select__trigger" aria-label="Color mode">
            <Select.Value<ColorModeOption>>
              {(state) => state.selectedOption()?.label ?? 'Select color mode'}
            </Select.Value>
            <Select.Icon class="select__icon">▼</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content class="select__content">
              <Select.Listbox class="select__listbox" />
            </Select.Content>
          </Select.Portal>
        </Select>
      </div>

      <div class="control-item">
        <label>
          Line Width: <span class="value">{triangulationState.lineWidth}</span>
        </label>
        <Slider
          value={[triangulationState.lineWidth]}
          onChange={(value) => setTriangulationState({ lineWidth: value[0] })}
          minValue={0.5}
          maxValue={5}
          step={0.5}
          class="slider"
        >
          <Slider.Track class="slider__track">
            <Slider.Fill class="slider__fill" />
            <Slider.Thumb class="slider__thumb">
              <Slider.Input />
            </Slider.Thumb>
          </Slider.Track>
        </Slider>
      </div>

      <div class="control-item">
        <label>Stroke Color:</label>
        <input
          type="color"
          value={triangulationState.strokeColor}
          onInput={(e) => setTriangulationState({ strokeColor: e.currentTarget.value })}
          class="color-input"
        />
      </div>

      <div class="control-item">
        <label>Background Color:</label>
        <input
          type="color"
          value={triangulationState.backgroundColor}
          onInput={(e) => setTriangulationState({ backgroundColor: e.currentTarget.value })}
          class="color-input"
        />
      </div>
    </div>
  );
};
