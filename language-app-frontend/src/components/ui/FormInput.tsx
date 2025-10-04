import { motion } from "framer-motion";
import type { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput: React.FC<FormInputProps> = ({ label, error, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-5"
    >
      <label className="block text-sm font-poppins font-bold text-dark mb-1.5">
        {label}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 font-poppins text-dark bg-white/90 shadow-sm focus:outline-none focus:ring-2 ${
          error
            ? "border border-red-500 focus:ring-red-200"
            : "border border-gray-100 focus:ring-accent hover:bg-white/80"
        }`}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-1.5 text-xs text-red-600 font-poppins animate-fade-in"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};

export default FormInput;
