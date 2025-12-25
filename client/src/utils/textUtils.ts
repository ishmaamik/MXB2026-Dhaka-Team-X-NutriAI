export const stripMarkdown = (text: string): string => {
  return (
    text
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove bullet points but keep content
      .replace(/^[\-\*\+]\s+/gm, '• ')
      // Clean up emojis at start of lines (optional - you can remove this if you want to keep emojis)
      .replace(/^[📊🥗⏰💡🎯🌟🔥✨]\s*/gm, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Clean up multiple line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
};

export const cleanAIResponse = (text: string): string => {
  return (
    text
      // Remove markdown headers but keep the content
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      // Convert markdown bold to plain text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Convert markdown italic to plain text
      .replace(/\*(.*?)\*/g, '$1')
      // Clean bullet points
      .replace(/^[\-\*\+]\s+/gm, '• ')
      // Remove excessive emojis but keep some structure
      .replace(/([📊🥗⏰💡🎯🌟🔥✨])\s*/g, '$1 ')
      // Clean up spacing
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim()
  );
};

export const formatAIResponseForDisplay = (
  response: string,
): {
  title: string;
  sections: Array<{
    heading: string;
    content: string;
    items?: string[];
  }>;
} => {
  const lines = response.split('\n').filter(line => line.trim());
  const sections: Array<{
    heading: string;
    content: string;
    items?: string[];
  }> = [];

  let currentSection: {
    heading: string;
    content: string;
    items?: string[];
  } | null = null;
  let title = 'AI Insights';

  lines.forEach(line => {
    const trimmed = line.trim();

    // Check if it's a header (starts with emoji or markdown)
    if (/^[📊🥗⏰💡🎯🌟🔥✨]/.test(trimmed) || /^#{1,6}\s+/.test(trimmed)) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      const heading = trimmed
        .replace(/^#{1,6}\s+/, '')
        .replace(/^[📊🥗⏰💡🎯🌟🔥✨]\s*/, '');

      if (!title || title === 'AI Insights') {
        title = heading;
      }

      currentSection = {
        heading,
        content: '',
        items: [],
      };
    } else if (
      /^[\-\*\+]\s+/.test(trimmed) ||
      /^[a-zA-Z\s]+:\s*\d/.test(trimmed)
    ) {
      // It's a list item
      const item = trimmed.replace(/^[\-\*\+]\s+/, '');
      if (currentSection) {
        currentSection.items = currentSection.items || [];
        currentSection.items.push(item);
      }
    } else {
      // Regular content
      if (currentSection) {
        currentSection.content += (currentSection.content ? ' ' : '') + trimmed;
      }
    }
  });

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return { title, sections };
};
