import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ButtonProps = {
  children: string;
  onClick?: () => void;
  faIcon?: IconProp;
  hoverVariant?: "danger" | "normal";
  variant?: "light" | "dark";
  active?: boolean;
};

const Button = ({
  onClick,
  children,
  variant = "dark",
  hoverVariant = "normal",
  active = true,
  faIcon,
}: ButtonProps) => {
  const baseStyles = "text-sm py-1.5 rounded-xs px-3 shadow-sm cursor-pointer";
  const variantStyles =
    variant === "light"
      ? "bg-[#f6f6f6] text-gray-900 border border-gray-200"
      : "bg-[#393939] text-white";
  const hoverStyles = active
    ? hoverVariant === "danger"
      ? "hover:bg-red-500 hover:text-white"
      : variant === "light"
      ? "hover:bg-gray-200 hover:shadow-sm transition-[0.2s]"
      : "hover:bg-slate-900 hover:shadow-sm transition-[0.2s]"
    : "";

  const activeStyles = active
    ? "opacity-100"
    : "opacity-50 !cursor-not-allowed";
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={`${baseStyles} ${variantStyles} ${hoverStyles} ${activeStyles}`}
    >
      {faIcon ? (
        <FontAwesomeIcon icon={faIcon} className="text-[12px] mr-2" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
