import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/pro-solid-svg-icons"; // or from '@fortawesome/free-solid-svg-icons'
import { IconProp } from "@fortawesome/fontawesome-svg-core";

type MajorButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "light" | "dark";
  faIcon?: IconProp;
};

const MajorButton = ({
  label,
  onClick,
  variant = "dark",
  faIcon = faQuestionCircle,
}: MajorButtonProps) => {
  const isDark = variant === "dark";

  const containerClasses = `
    p-4 w-fit flex flex-col text-sm gap-3 min-w-[180px] rounded-md shadow-sm font-light cursor-pointer
    ${isDark ? "bg-[#101010] text-white" : "bg-white text-black font-medium"}
  `;

  const iconClasses = `
    w-[20px] h-[20px] flex items-center justify-left
  `;

  return (
    <div className={containerClasses} onClick={onClick}>
      <div className={iconClasses}>
        <FontAwesomeIcon icon={faIcon} className="text-[17px] text-center" />
      </div>
      <p>{label}</p>
    </div>
  );
};

export default MajorButton;
