import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional class names with clsx and safely merges Tailwind utility classes with twMerge.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;

