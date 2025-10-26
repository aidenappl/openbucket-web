import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";

export type DropdownItem = {
  label: string;
  icon?: IconProp;
  href?: string;
  variant?: "action" | "default";
  onClick?: () => void;
};

type DropdownProps = {
  items: DropdownItem[];
  value?: DropdownItem["label"];
  onChange?: (value: string) => void;
};

const Dropdown = ({ items, value, onChange = () => {} }: DropdownProps) => {
  const [item, setItem] = useState<DropdownItem>(
    items.find((item) => item.label === value) || items[0]
  );
  const [visible, setVisible] = useState(false);

  const handleItemClick = (item: DropdownItem) => {
    if (item.onClick) {
      item.onClick();
    }
    setVisible(false);
    setItem(item);
    onChange(item.label);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex w-full cursor-pointer items-center justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => setVisible(!visible)}
        >
          {item.label}

          <FontAwesomeIcon
            className="text-sm text-gray-500"
            icon={faChevronDown}
          />
        </button>
      </div>

      <div
        className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden"
        role="menu"
        hidden={!visible}
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabIndex={-1}
      >
        {items.map((dropItem, index) =>
          dropItem.href ? (
            <Link
              key={index}
              href={dropItem.href}
              className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                dropItem.variant === "action" ? "font-semibold" : ""
              }`}
              role="menuitem"
              id={`menu-item-${index}`}
              tabIndex={-1}
              onClick={() => {
                setVisible(false);
              }}
            >
              {dropItem.icon && (
                <FontAwesomeIcon icon={dropItem.icon} className="mr-2" />
              )}
              {dropItem.label}
            </Link>
          ) : (
            <a
              key={index}
              className={
                `flex items-center gap-2 cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 truncate` +
                (dropItem.label == item.label && " font-medium text-black")
              }
              role="menuitem"
              id={`menu-item-${index}`}
              tabIndex={-1}
              onClick={() => handleItemClick(dropItem)}
            >
              {dropItem.icon && (
                <FontAwesomeIcon icon={dropItem.icon} className="mr-2" />
              )}
              {dropItem.label == item.label && (
                <div className="w-[7px] h-[7px] bg-blue-700 rounded-full" />
              )}
              {dropItem.label}
            </a>
          )
        )}
      </div>
    </div>
  );
};

export default Dropdown;
