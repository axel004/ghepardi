import Link from 'next/link';
import { Fragment } from 'react';

export function mentionNames(text: string) {
  return [...text.matchAll(/(^|[^a-zA-Z0-9_])@([a-z0-9_]{3,30})(?![a-zA-Z0-9_])/g)].map(match => match[2]);
}

export function MentionText({ text, names }: { text: string; names: Set<string> }) {
  let index = 0;
  const parts = [...text.matchAll(/(^|[^a-zA-Z0-9_])@([a-z0-9_]{3,30})(?![a-zA-Z0-9_])/g)].map(match => {
    const start = match.index + match[1].length, before = text.slice(index, start);
    index = start + match[2].length + 1;
    return <Fragment key={start}>{before}{names.has(match[2]) ? <Link href={`/members/${match[2]}`}>@{match[2]}</Link> : `@${match[2]}`}</Fragment>;
  });
  return <>{parts}{text.slice(index)}</>;
}
