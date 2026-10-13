import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

const Input = forwardRef(({
  label,
  error,
  hint,
  className = '',
  id,
  children,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">{label}</label>
      )}
      {children ? (
        <div className="relative">
          {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{leftIcon}</span>}
          {children}
        </div>
      ) : (
        <div className="relative">
          {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input',
              leftIcon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">{rightIcon}</span>}
        </div>
      )}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;