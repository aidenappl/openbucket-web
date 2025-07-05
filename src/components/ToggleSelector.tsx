import React, { cloneElement, ReactElement, useState } from "react";
import { ToggleOptionProps } from "./ToggleOption";

type ToggleSelectorProps = {
  children: ReactElement<ToggleOptionProps>[];
  onChange?: (index: number) => void;
};

const ToggleSelector = ({ children, onChange }: ToggleSelectorProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <div className="flex border border-gray-200 overflow-hidden rounded-sm cursor-pointer text-sm">
      {children.map((child, index) =>
        cloneElement(child, {
          selected: index === activeIndex,
          onSelect: () => {
            setActiveIndex(index);
            onChange?.(index);
          },
        })
      )}
    </div>
  );
};

export default ToggleSelector;
