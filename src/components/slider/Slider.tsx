import React, { useEffect, useRef } from "react";
import "./Slider.css";

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  ...rest
}) => {
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      const percentage = ((value - min) / (max - min)) * 100;
      sliderRef.current.style.background = `linear-gradient(to right, var(--theme-selection-color) ${percentage}%, #e5e5ea ${percentage}%)`;
    }
  }, [value, min, max]);

  return (
    <div className="macos-slider-container" {...rest}>
      <input
        type="range"
        ref={sliderRef}
        className="macos-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default Slider;
