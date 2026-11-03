export const categories = ['news', 'stories', 'cronache', 'viaggi', 'serate', 'meme', 'speciali'] as const;
export const emojis = ['😂', '💀', '🐆', '🔥', '🤡'] as const;
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function pageNumber(value?: string) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && n <= 10000 ? n : 1;
}
