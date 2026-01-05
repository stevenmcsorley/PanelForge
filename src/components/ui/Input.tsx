/**
 * Input Components
 * Reusable form inputs for the editor
 */

import React from 'react';
import './ui.css';

interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'color';
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
  disabled = false,
}) => {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input
        type={type}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
    </div>
  );
};

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <select
        className="input-field select-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  showValue = true,
  disabled = false,
}) => {
  return (
    <div className="input-group">
      <label className="input-label">
        {label}
        {showValue && <span className="slider-value">{value}</span>}
      </label>
      <input
        type="range"
        className="slider-field"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
    </div>
  );
};

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="checkbox-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          className="checkbox-field"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span>{label}</span>
      </label>
    </div>
  );
};

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
}) => {
  return (
    <button
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
