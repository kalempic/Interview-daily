import type { ReactNode } from 'react';
import { Prose } from './ui';

type Block =
  | { type: 'h'; level: number; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'pre'; text: string };

export function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);
  return (
    <Prose>{blocks.map((block, index) => renderBlock(block, index))}</Prose>
  );
}

function renderBlock(block: Block, index: number): ReactNode {
  const key = `${block.type}-${index}`;
  if (block.type === 'h') {
    const Tag = block.level <= 2 ? 'h2' : 'h3';
    return <Tag key={key}>{renderInline(block.text, key)}</Tag>;
  }
  if (block.type === 'p') return <p key={key}>{renderInline(block.text, key)}</p>;
  if (block.type === 'ul' || block.type === 'ol') {
    const Tag = block.type;
    return (
      <Tag key={key}>
        {block.items.map((item, itemIndex) => (
          <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
        ))}
      </Tag>
    );
  }
  return (
    <pre key={key}>
      <code>{block.text}</code>
    </pre>
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(<code key={`${keyPrefix}-c-${index}`}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<strong key={`${keyPrefix}-b-${index}`}>{token.slice(2, -2)}</strong>);
    }
    last = match.index + token.length;
    index += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let fence: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'p', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push({ type: list.type, items: list.items });
    list = null;
  };

  for (const line of lines) {
    if (fence) {
      if (line.trim().startsWith('```')) {
        blocks.push({ type: 'pre', text: fence.join('\n') });
        fence = null;
      } else {
        fence.push(line);
      }
      continue;
    }
    if (line.trim().startsWith('```')) {
      flushParagraph();
      flushList();
      fence = [];
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h', level: heading[1].length, text: heading[2].trim() });
      continue;
    }
    const item = /^(\s*)([-*]|\d+\.)\s+(.+)$/.exec(line);
    if (item) {
      flushParagraph();
      const type = item[2] === '-' || item[2] === '*' ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(item[3].trim());
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }

  if (fence) blocks.push({ type: 'pre', text: fence.join('\n') });
  flushParagraph();
  flushList();
  return blocks;
}
