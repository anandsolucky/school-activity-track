import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          animate-spin rounded-full
          border-2 border-gray-200
          border-t-2 border-t-blue-600
          ${sizeClasses[size]}
          ${className}
        `}
      />
    </div>
  );
};
