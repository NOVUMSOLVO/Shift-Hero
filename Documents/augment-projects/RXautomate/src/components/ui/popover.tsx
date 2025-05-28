import React, { useState } from 'react';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

const Popover: React.FC<PopoverProps> = ({ trigger, content, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="absolute bg-white border rounded shadow p-2">
          {content}
        </div>
      )}
    </div>
  );
};

export const PopoverTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

export const PopoverContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`absolute bg-white border rounded shadow p-2 ${className}`}>{children}</div>
);

export { Popover };