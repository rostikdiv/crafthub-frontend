import React, { forwardRef, useState, InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

type InputProps = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, type, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate mb-1.5">

          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={currentType}
            className={`
              w-full px-3 py-2.5
              bg-white border border-border rounded-sm
              shadow-inner
              text-sm text-slate
              placeholder:text-gray-400
              focus:outline-none focus:border-tactical
              transition-colors duration-150
              ${isPassword ? 'pr-10' : ''}
              ${error ? 'border-restricted' : ''}
              ${className}
            `}
            {...props} />

          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tactical focus:outline-none flex items-center justify-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          )}
        </div>

        {error &&
        <p className="mt-1 text-xs text-restricted font-medium">{error}</p>
        }
      </div>);

  }
);
Input.displayName = 'Input';