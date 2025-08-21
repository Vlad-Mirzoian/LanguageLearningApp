import type { SelectHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  options,
  multiple,
  ...props
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
        {label}
      </label>
      <select
        {...props}
        multiple={multiple}
        className={`w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
          error
            ? "border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200"
        } bg-white shadow-sm focus:outline-none focus:ring-2 ${
          multiple ? "h-24" : ""
        }`}
      >
        {!multiple && (
          <option value="" disabled>
            {t("formSelect.selectOption")}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value || "none"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 animate-fade-in">{error}</p>
      )}
    </div>
  );
};

export default FormSelect;
