import React from "react";

interface MathRendererProps {
  text: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, inline }) => {
  // Simple math renderer - renders LaTeX-like text as plain text
  // Replace $...$ with styled spans for inline math
  const renderMath = (input: string) => {
    if (!input) return null;
    const parts = input.split(/(\$[^$]+\$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        return (
          <span key={idx} style={{
            fontFamily: "'KaTeX_Math', 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: "1.05em",
          }}>
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  if (inline) {
    return <span style={{ display: "inline" }}>{renderMath(text)}</span>;
  }
  return <div style={{ lineHeight: 1.6 }}>{renderMath(text)}</div>;
};