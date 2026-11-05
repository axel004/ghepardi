import { HighlightsPage } from '../highlights-page';
export const metadata = { title: 'Hall of Shame' };
export default function HallOfShame({ searchParams }: { searchParams: Promise<{ page?: string; edit?: string; error?: string; saved?: string; deleted?: string }> }) { return <HighlightsPage kind="shame" searchParams={searchParams} />; }
