import { useId } from "react";

type InputProps = {
  placeholder?: string;
  value?: string;
  label?: string;
  id?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Input = ({
  placeholder,
  value,
  id,
  label,
  type = "text",
  required = false,
  disabled = false,
  onChange,
}: InputProps) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm leading-none font-medium text-gray-900 dark:text-zinc-100"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className="min-w-[200px] mt-1 text-sm block bg-white dark:bg-zinc-900 dark:text-zinc-100 pl-3 py-1.5 pr-3 rounded-sm outline-1 -outline-offset-1 outline-gray-300 dark:outline-zinc-600"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      />
    </div>
  );
};

export default Input;
