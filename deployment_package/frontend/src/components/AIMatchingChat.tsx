import React from 'react';

interface AIMatchingChatProps {
  className?: string;
}

export const AIMatchingChat: React.FC<AIMatchingChatProps> = ({ className }) => {
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">AI Matching Chat</h3>
      <p className="text-gray-600">AI matching chat component placeholder</p>
    </div>
  );
};

export default AIMatchingChat;