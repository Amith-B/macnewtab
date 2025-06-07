import { ChangeEvent, ReactElement } from "react";
import "./Select.css";

export const Select = ({
  options,
  value,
  onChange,
  id,
  name,
}: {
  options: Array<{ value: string; label: string | ReactElement }>;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  id?: string;
  name?: string;
}) => {
  return (
    <div className="select-container">
      <div className="select">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className="select-input"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
