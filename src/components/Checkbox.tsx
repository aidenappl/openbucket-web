import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type CheckboxState = "checked" | "unchecked" | "indeterminate";

type CheckboxProps = {
  state: CheckboxState;
  onToggle: (event?: React.MouseEvent) => void;
};

const Checkbox = ({ state, onToggle }: CheckboxProps) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // prevent triggering parent onClick
    onToggle(e);
  };

  return (
    <div
      className={`flex items-center justify-center w-[20px] h-[20px] rounded-sm border border-gray-300 cursor-pointer select-none ${
        state === "checked"
          ? "bg-[#47b577] hover:bg-green-600"
          : state === "indeterminate"
          ? "bg-yellow-400 hover:bg-yellow-500"
          : "bg-white hover:bg-gray-200"
      } `}
      onClick={handleClick}
    >
      {state === "checked" && (
        <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
      )}
      {state === "indeterminate" && (
        <div className="w-[10px] h-[2px] bg-white rounded-sm" />
      )}
    </div>
  );
};

export default Checkbox;
