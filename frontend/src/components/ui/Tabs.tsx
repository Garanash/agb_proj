import React, { useState } from 'react';

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

interface TabProps {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export const Tabs: React.FC<TabsProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8">
        {children}
      </nav>
    </div>
  );
};

export const Tab: React.FC<TabProps> = ({ label, children, active = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
};

export default Tabs;
