"use client";

import React, { cloneElement, ReactElement, useEffect, useState } from "react";
import { ToggleOptionProps } from "./ToggleOption";

type ToggleSelectorProps = {
  children: ReactElement<ToggleOptionProps>[];
  value?: number;
  onChange?: (index: number) => void;
};

const ToggleSelector = ({
  children,
  onChange,
  value = 0,
}: ToggleSelectorProps) => {
  const [activeIndex, setActiveIndex] = useState(value);

  useEffect(() => {
    setActiveIndex(value);
  }, [value]);

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
