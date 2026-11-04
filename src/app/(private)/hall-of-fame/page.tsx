import { HighlightsPage } from '../highlights-page';
export default function HallOfFame({ searchParams }: { searchParams: Promise<{ page?: string; edit?: string; error?: string; saved?: string; deleted?: string }> }) { return <HighlightsPage kind="fame" searchParams={searchParams} />; }
