import type { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput: React.FC<FormInputProps> = ({ label, error, ...props }) => {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
        {label}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
          error
            ? "border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
        } bg-white shadow-sm focus:outline-none focus:ring-2`}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500 animate-fade-in">{error}</p>
      )}
    </div>
  );
};

export default FormInput;
