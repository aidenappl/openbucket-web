export type ToggleOptionProps = {
  children: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
};

const ToggleOption = ({ children, selected, onSelect }: ToggleOptionProps) => {
  return (
    <div
      className={`[&:not(:last-child)]:border-r-1 border-gray-200 dark:border-zinc-700 py-1.5 px-2 min-w-[50px] flex items-center justify-center ${
        selected
          ? "bg-[#f5fff6] dark:bg-green-900/30 text-green-600 dark:text-green-400"
          : "bg-white dark:bg-zinc-900 text-[#3a3a3a] dark:text-zinc-300"
      }`}
      onClick={onSelect}
    >
      {children}
    </div>
  );
};

export default ToggleOption;
