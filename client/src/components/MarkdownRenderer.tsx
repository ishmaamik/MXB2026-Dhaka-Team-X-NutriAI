import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  // Function to convert markdown to clean HTML
  const parseMarkdown = (text: string): string => {
    return (
      text
        // Remove markdown headers (# ## ###)
        .replace(/^#{1,6}\s+/gm, '')
        // Convert **bold** to <strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert *italic* to <em>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Handle bullet points and emojis at start of lines
        .replace(/^[📊🥗⏰💡🎯🌟🔥✨]?\s*[\-\*\+]?\s*(.+)$/gm, '<li>$1</li>')
        // Convert line starting with emojis to headers
        .replace(
          /^([📊🥗⏰💡🎯🌟🔥✨])\s*(.+)$/gm,
          '<h4 class="font-semibold text-gray-800 mt-4 mb-2">$1 $2</h4>',
        )
        // Wrap consecutive list items in <ul>
        .replace(
          /((?:<li>.*?<\/li>\s*)+)/gs,
          '<ul class="list-disc list-inside space-y-1 ml-4">$1</ul>',
        )
        // Convert line breaks to <br>
        .replace(/\n/g, '<br>')
        // Clean up extra <br> tags around headers and lists
        .replace(/<br>\s*<h4/g, '<h4')
        .replace(/<\/h4>\s*<br>/g, '</h4>')
        .replace(/<br>\s*<ul/g, '<ul')
        .replace(/<\/ul>\s*<br>/g, '</ul>')
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim()
    );
  };

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{
        __html: parseMarkdown(content),
      }}
    />
  );
};

export default MarkdownRenderer;
