// src/shared/components/chat/CopyMessageButton.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '@/shared/utils/clipboard';

/**
 * Per-message copy affordance. Falls back silently when the clipboard is
 * unavailable (insecure context) so the button never throws mid-copy, and only
 * flips to "Copied ✓" once the write actually resolved.
 */
interface CopyMessageButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function CopyMessageButton({ text, className = '', size = 'md' }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard' : 'Copy message'}
      aria-live="polite"
      className={`inline-flex items-center gap-1 transition-colors ${
        copied ? 'text-emerald-500' : 'hover:text-teal-500'
      } ${className}`}
    >
      {copied ? <Check className={`${iconSize} text-emerald-500`} /> : <Copy className={iconSize} />}
      <span>{copied ? 'Copied ✓' : 'Copy'}</span>
    </button>
  );
}
