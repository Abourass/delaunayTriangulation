import { Component, For } from 'solid-js';
import { Select } from '@kobalte/core/select';
import { Slider } from '@kobalte/core/slider';
import { triangulationState, setTriangulationState } from '../stores/triangulationStore';

interface GeneratorOption {
  value: string;
  label: string;
  description: string;
}

const generatorOptions: GeneratorOption[] = [
  { value: 'random', label: 'Random', description: 'Uniformly distributed random points' },
  { value: 'grid', label: 'Grid', description: 'Points arranged in a grid pattern' },
  { value: 'circular', label: 'Circular', description: 'Points in concentric circles' },
  { value: 'spiral', label: 'Spiral', description: 'Golden ratio spiral pattern' },
  { value: 'poisson', label: 'Poisson Disk', description: 'Natural-looking distribution' },
  { value: 'interactive', label: 'Interactive', description: 'Click to place points' },
];

export const GeneratorControls: Component = () => {
  return (
    <div class="control-group">
      <h3>Point Generator</h3>

      <div class="control-item">
        <label>Generator Type:</label>
        <Select
          value={triangulationState.selectedGenerator}
          onChange={(value) => setTriangulationState({ selectedGenerator: value })}
          options={generatorOptions}
          optionValue="value"
          optionTextValue="label"
          placeholder="Select a generator"
          itemComponent={(props) => (
            <Select.Item item={props.item} class="select__item">
              <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
              <Select.ItemDescription class="select__description">
                {props.item.rawValue.description}
              </Select.ItemDescription>
              <Select.ItemIndicator class="select__item-indicator">✓</Select.ItemIndicator>
            </Select.Item>
          )}
        >
          <Select.Trigger class="select__trigger" aria-label="Generator type">
            <Select.Value<GeneratorOption>>
              {(state) => state.selectedOption()?.label ?? 'Select generator'}
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

      {triangulationState.selectedGenerator !== 'interactive' && (
        <div class="control-item">
          <label>
            Point Count: <span class="value">{triangulationState.pointCount}</span>
          </label>
          <Slider
            value={[triangulationState.pointCount]}
            onChange={(value) => setTriangulationState({ pointCount: value[0] })}
            minValue={10}
            maxValue={200}
            step={5}
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
      )}
    </div>
  );
};
