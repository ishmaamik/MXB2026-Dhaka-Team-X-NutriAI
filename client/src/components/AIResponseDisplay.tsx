import React from 'react';
import { Brain } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface AIResponseDisplayProps {
  response: {
    success: boolean;
    response?: string;
    toolsUsed?: number;
    insights?: string;
    error?: string;
  };
  className?: string;
  showTools?: boolean;
}

const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({
  response,
  className = '',
  showTools = true,
}) => {
  if (!response.success && response.error) {
    return (
      <div
        className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h4 className="font-medium text-red-900 mb-1">Error</h4>
            <p className="text-red-700">{response.error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response.response) {
    return (
      <div
        className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-gray-600">No response available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900">AI Assistant</h4>
            {showTools && response.toolsUsed && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                Used {response.toolsUsed} analysis tools
              </span>
            )}
          </div>
          <div className="text-gray-700">
            <MarkdownRenderer
              content={response.response}
              className="space-y-2"
            />
          </div>
          {response.insights && (
            <div className="mt-3 text-xs text-gray-500">
              {response.insights}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResponseDisplay;
