import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center text-center py-16 px-4 animate-fade-in',
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[var(--border-secondary)] flex items-center justify-center mb-4 text-[var(--text-primary)] shadow-sm bg-[var(--bg-secondary)]">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--text-secondary)] stroke-[1.5]" />
        </div>
      )}
      {title && (
        <h3 className="text-base sm:text-xl font-bold text-[var(--text-primary)] mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="default" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}

export default EmptyState;

