import React, { useId } from "react";
import "./Checkbox.css";

interface CheckboxProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  label?: string;
  name?: string;
  value?: string;
  indeterminate?: boolean;
  description?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  name,
  value,
  indeterminate = false,
  description,
}) => {
  const id = useId();
  const descriptionId = `${id}-description`;
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div className={`checkbox-wrapper ${disabled ? "disabled" : ""}`}>
      <input
        id={id}
        ref={inputRef}
        type="checkbox"
        className="checkbox-input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value}
        aria-checked={indeterminate ? "mixed" : checked}
        aria-disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
      />
      <label htmlFor={id} className="checkbox-label">
        <span
          className={`checkbox-ui ${checked ? "checked" : ""} ${
            indeterminate ? "indeterminate" : ""
          }`}
        >
          {checked && (
            <svg className="checkbox-checkmark" viewBox="0 0 12 10">
              <polyline points="1.5 6 4.5 9 10.5 1" />
            </svg>
          )}
          {indeterminate && !checked && (
            <svg className="checkbox-indeterminate" viewBox="0 0 12 2">
              <line x1="1" y1="1" x2="11" y2="1" />
            </svg>
          )}
        </span>
        <span className="checkbox-label-text">{label}</span>
      </label>
      {description && (
        <div id={descriptionId} className="checkbox-description">
          {description}
        </div>
      )}
    </div>
  );
};

export default Checkbox;
