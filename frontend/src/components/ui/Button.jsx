import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  default: 'bg-[#0095f6] text-white hover:bg-[#1877f2] shadow-sm',
  secondary: 'bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-[var(--border-secondary)]',
  outline: 'border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
  ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
  destructive: 'bg-[var(--color-error)] text-white hover:opacity-90',
  link: 'text-[var(--color-primary)] underline-offset-4 hover:underline p-0 h-auto',
  gradient: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white hover:opacity-95 shadow-md',
};

const buttonSizes = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9 p-0 flex items-center justify-center',
};

export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
          'active:scale-[0.98]',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          buttonVariants[variant] || buttonVariants.default,
          buttonSizes[size] || buttonSizes.default,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

