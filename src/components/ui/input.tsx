import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Input component
 * 
 * @example
 * <Input type="email" placeholder="Enter email" />
 * <Input error={!!errors.email} />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[#30363D] bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] px-3 py-2 text-sm text-[#E6EDF3] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#6E7681] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-[#58A6FF]/30',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
