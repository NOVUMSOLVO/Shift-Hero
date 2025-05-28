import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}

const Badge: React.FC<BadgeProps> = ({ children, className = '', variant = 'default' }) => {
  return (
    <span className={`px-2 py-1 text-sm font-medium rounded bg-gray-200 ${className}`}>
      {children}
    </span>
  );
};

export { Badge };