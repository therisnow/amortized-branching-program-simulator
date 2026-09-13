'use client';

import katex from 'katex';

type MathProps = {
  tex: string;
  display?: boolean;
  className?: string;
  label?: string;
};

export function Math({ tex, display = false, className = '', label }: MathProps) {
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    strict: false,
    trust: false,
    output: 'html',
  });

  return (
    <span
      className={`math-render ${display ? 'math-display' : 'math-inline'} ${className}`}
      aria-label={label ?? tex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
