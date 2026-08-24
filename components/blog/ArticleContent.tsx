import { ReactNode } from 'react';

/** Shared lightweight markdown renderer for blog content.
 *
 *  Supported syntax (one construct per line):
 *   ## Heading 2          ### Heading 3
 *   - bullet / 1. ordered lists (continuation lines are joined)
 *   | a | b | tables (separator rows are skipped)
 *   --- or *** horizontal rule
 *   **bold** / *italic* inline spans
 */

type Block =
  | { type: 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' };

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${key++}`} className="font-semibold text-text-primary">{match[1]}</strong>);
    } else {
      nodes.push(<em key={`${keyPrefix}-${key++}`}>{match[2]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-{3,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      if (rows.length > 0) {
        blocks.push({ type: 'table', headers: rows[0], rows: rows.slice(1) });
      }
      continue;
    }
    const isOrdered = /^\d+\.\s/.test(line);
    const isBullet = /^[-*]\s/.test(line);
    if (isOrdered || isBullet) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l) {
          if (items.length > 0 && i + 1 < lines.length) {
            const next = lines[i + 1]?.trim() ?? '';
            if (isOrdered ? /^\d+\.\s/.test(next) : /^[-*]\s/.test(next)) {
              i++;
              continue;
            }
          }
          break;
        }
        if (isOrdered ? /^\d+\.\s/.test(l) : /^[-*]\s/.test(l)) {
          items.push(l.replace(isOrdered ? /^\d+\.\s*/ : /^[-*]\s*/, ''));
          i++;
        } else if (l.startsWith('#') || l.startsWith('|') || /^-{3,}$/.test(l)) {
          break;
        } else if (items.length > 0) {
          items[items.length - 1] += ` ${l}`;
          i++;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        blocks.push({ type: isOrdered ? 'ol' : 'ul', items });
      }
      continue;
    }
    blocks.push({ type: 'p', text: line });
    i++;
  }
  return blocks;
}

export function ArticleContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={i} className="text-2xl md:text-[28px] font-extrabold text-text-primary mt-10 mb-4">
                {parseInline(block.text, `h2-${i}`)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="text-xl font-bold text-text-primary mt-8 mb-3">
                {parseInline(block.text, `h3-${i}`)}
              </h3>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc pl-6 space-y-2 mb-5 text-text-primary leading-relaxed">
                {block.items.map((item, li) => (
                  <li key={li}>{parseInline(item, `ul-${i}-${li}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="list-decimal pl-6 space-y-2 mb-5 text-text-primary leading-relaxed">
                {block.items.map((item, li) => (
                  <li key={li}>{parseInline(item, `ol-${i}-${li}`)}</li>
                ))}
              </ol>
            );
          case 'table':
            return (
              <div key={i} className="overflow-x-auto my-6 rounded-[12px] border border-border">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {block.headers.map((h, hi) => (
                        <th key={hi} className="text-left py-3 px-4 bg-surface-alt font-semibold text-text-primary border-b border-border">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-border last:border-b-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-3 px-4 text-text-secondary">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'hr':
            return <hr key={i} className="my-8 border-border" />;
          case 'p':
          default:
            return (
              <p key={i} className="text-text-primary leading-relaxed mb-4 text-[17px]">
                {parseInline(block.text, `p-${i}`)}
              </p>
            );
        }
      })}
    </>
  );
}
