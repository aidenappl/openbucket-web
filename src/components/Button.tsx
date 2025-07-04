import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type ButtonProps = {
  children: string;
  onClick?: () => void;
  faIcon?: IconProp;
  variant?: "light" | "dark";
};

const Button = ({
  onClick,
  children,
  variant = "dark",
  faIcon,
}: ButtonProps) => {
  const baseStyles = "text-sm py-1.5 rounded-xs px-3 shadow-sm cursor-pointer";
  const variantStyles =
    variant === "light"
      ? "bg-[#f6f6f6] text-gray-900 border border-gray-200"
      : "bg-[#393939] text-white";

  return (
    <button onClick={onClick} className={`${baseStyles} ${variantStyles}`}>
      {faIcon ? (
        <FontAwesomeIcon icon={faIcon} className="text-[12px] mr-2" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
