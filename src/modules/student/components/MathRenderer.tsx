import React from 'react';

interface MathRendererProps {
  text: string;
  inline?: boolean;
  display?: boolean;
  className?: string;
  latex?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, inline = false, display = false, className = '', latex }) => {
  const content = text || latex || '';
  // Simple fallback renderer — replace with KaTeX or MathJax in production
  return (
    <span className={`math-renderer font-mono ${display ? 'block text-center my-2' : inline ? 'inline' : 'inline'} ${className}`}>
      {content}
    </span>
  );
};

export default MathRenderer;
