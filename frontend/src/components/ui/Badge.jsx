import React from 'react';
import { cn } from '../../utils/cn';

const badgeVariants = {
  default: 'bg-[var(--color-primary)] text-white hover:opacity-90',
  secondary: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  destructive: 'bg-[var(--color-error)] text-white hover:opacity-90',
  outline: 'border border-[var(--border-subtle)] text-[var(--text-primary)]',
  success: 'bg-[var(--color-success)] text-white',
  verified: 'bg-[#0095f6] text-white',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors select-none',
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;

