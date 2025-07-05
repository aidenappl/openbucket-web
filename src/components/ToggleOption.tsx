export type ToggleOptionProps = {
  children: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
};

const ToggleOption = ({ children, selected, onSelect }: ToggleOptionProps) => {
  return (
    <div
      className={`[&:not(:last-child)]:border-r-1 border-gray-200 py-1.5 px-2 min-w-[50px] flex items-center justify-center ${
        selected ? "bg-[#f5fff6] text-green-600" : "bg-white text-[#3a3a3a]"
      }`}
      onClick={onSelect}
    >
      {children}
    </div>
  );
};

export default ToggleOption;
