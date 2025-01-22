import { ChangeEvent, ReactElement } from "react";
import "./Select.css";

export const Select = ({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string | ReactElement }>;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) => {
  return (
    <div className="select-container">
      <div className="select">
        <select value={value} onChange={onChange} className="select-input">
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
