export type CheckboxState = "checked" | "unchecked" | "indeterminate";

type CheckboxProps = {
  state: CheckboxState;
  onToggle: () => void;
};

const Checkbox = ({ state, onToggle }: CheckboxProps) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // prevent triggering parent onClick
    onToggle();
  };

  return (
    <div
      className={`flex items-center justify-center w-[20px] h-[20px] rounded-sm border border-gray-300 cursor-pointer select-none ${
        state === "checked"
          ? "bg-[#47b577]"
          : state === "indeterminate"
          ? "bg-yellow-400"
          : "bg-white"
      }`}
      onClick={handleClick}
    >
      {state === "checked" && (
        <div className="w-[5px] h-[5px] bg-white rounded-sm" />
      )}
      {state === "indeterminate" && (
        <div className="w-[10px] h-[2px] bg-white rounded-sm" />
      )}
    </div>
  );
};

export default Checkbox;
