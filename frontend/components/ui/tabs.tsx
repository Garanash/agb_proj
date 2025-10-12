import React, { useState } from 'react';

interface TabsProps {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, className = '', defaultValue }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || '');
  
  return (
    <div className={`${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8">
        {children}
      </nav>
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '' }) => {
  return (
    <button
      className={`py-2 px-1 border-b-2 font-medium text-sm ${className}`}
      data-value={value}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  return (
    <div className={`${className}`} data-value={value}>
      {children}
    </div>
  );
};

export default Tabs;
