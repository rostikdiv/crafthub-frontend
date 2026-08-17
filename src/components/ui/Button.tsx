import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-amber text-white border-amber hover:bg-amber-dark hover:border-amber-dark',
  secondary:
    'bg-transparent text-slate border-slate hover:bg-slate hover:text-cream',
  danger:
    'bg-restricted text-white border-restricted hover:bg-red-700 hover:border-red-700'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base'
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{
        scale: 0.98
      }}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold uppercase tracking-wider
        border-2 rounded-sm
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}>

      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </motion.button>);
}