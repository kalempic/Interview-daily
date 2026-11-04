export function spokenScore(label: string): string {
  const match = /^(\d+)\/(\d+)$/.exec(label.trim());
  if (match) return `${match[1]} of ${match[2]}`;
  if (label.trim() === '' || label.trim() === '—' || label.trim() === '-') return 'Not scored';
  return label;
}
