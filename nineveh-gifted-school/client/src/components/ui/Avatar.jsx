import { cn } from '../../utils/helpers';
import { getInitials, generateAvatarColor } from '../../utils/helpers';

export default function Avatar({ 
  src, 
  alt, 
  name = '', 
  size = 'md', 
  className = '',
  status 
}) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={cn('rounded-full object-cover', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium text-white',
            sizes[size],
            generateAvatarColor(name || 'user')
          )}
          aria-label={name}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 border-2 border-white rounded-full',
            statusSizes[size],
            statusColors[status]
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}