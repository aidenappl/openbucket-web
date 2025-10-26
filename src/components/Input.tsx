import { useId } from "react";

type InputProps = {
  placeholder?: string;
  value?: string;
  label?: string;
  id?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Input = ({
  placeholder,
  value,
  id,
  label,
  required = false,
  onChange,
}: InputProps) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm leading-none font-medium text-gray-900"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className="min-w-[200px] mt-1 text-sm block bg-white pl-3 py-1.5 pr-3 rounded-sm outline-1 -outline-offset-1 outline-gray-300"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};

export default Input;
