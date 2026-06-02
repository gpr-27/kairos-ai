import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { cn } from '@/lib/utils';

// ── Code block with copy button ──────────────────────────────────────────────

export function CodeBlock({ language, code }: { language: string; code: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-border/40 my-3 overflow-hidden rounded-lg border">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-[#1e1e2e] px-4 py-2">
        <span className="font-mono text-[11px] font-medium text-violet-400">
          {language || 'code'}
        </span>
        <button
          onClick={() => void handleCopy()}
          className={cn(
            'flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
            copied ? 'text-emerald-400' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
          )}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Highlighted code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#1a1a2e',
          fontSize: '13px',
          lineHeight: '1.6',
          padding: '16px',
        }}
        showLineNumbers={code.split('\n').length > 4}
        lineNumberStyle={{ color: '#4a4a6a', minWidth: '2.5em', paddingRight: '1em' }}
        PreTag="div"
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ── Markdown renderer (ChatGPT-style) ────────────────────────────────────────

const MD_COMPONENTS: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const code = String(children).replace(/\n$/, '');
    const isBlock = match || code.includes('\n');

    if (isBlock) {
      return <CodeBlock language={match?.[1] ?? ''} code={code} />;
    }

    return (
      <code className="rounded-[4px] bg-zinc-700/60 px-[5px] py-[2px] font-mono text-[13px] text-violet-300">
        {children}
      </code>
    );
  },

  p({ children }) {
    return <p className="my-2 leading-7">{children}</p>;
  },

  h1({ children }) {
    return <h1 className="mb-3 mt-5 text-xl font-bold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-2 mt-4 text-lg font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-1.5 mt-3 text-base font-semibold">{children}</h3>;
  },

  ul({ children }) {
    return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-6">{children}</li>;
  },

  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l-[3px] border-violet-500/50 pl-4 italic text-zinc-400">
        {children}
      </blockquote>
    );
  },

  strong({ children }) {
    return <strong className="font-semibold text-white">{children}</strong>;
  },

  em({ children }) {
    return <em className="italic text-zinc-300">{children}</em>;
  },

  hr() {
    return <hr className="border-border/50 my-4" />;
  },

  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
      >
        {children}
      </a>
    );
  },

  table({ children }) {
    return (
      <div className="border-border/40 my-3 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-muted/30">{children}</thead>;
  },
  th({ children }) {
    return (
      <th className="border-border/40 border-b px-4 py-2 text-left font-semibold">{children}</th>
    );
  },
  td({ children }) {
    return <td className="border-border/20 border-b px-4 py-2">{children}</td>;
  },
};

// ── Convenience renderer ─────────────────────────────────────────────────────

/** Renders assistant markdown using the shared ChatGPT-style component set. */
export function MarkdownMessage({ content }: { content: string }): JSX.Element {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}
