import React from 'react';
import { CheckIcon } from 'lucide-react';
type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked' | 'type'>;
export function Checkbox({
  label,
  checked,
  onChange,
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label
      htmlFor={checkboxId}
      className={`flex items-center gap-2.5 cursor-pointer group ${className}`}>

      <div className="relative">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          {...props} />

        <div
          className={`
            w-4 h-4 border-2 rounded-sm
            flex items-center justify-center
            transition-colors duration-150
            ${checked ? 'bg-tactical border-tactical' : 'bg-white border-border group-hover:border-slate'}
          `}>

          {checked &&
          <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
          }
        </div>
      </div>
      <span className="text-sm text-slate">{label}</span>
    </label>);

}