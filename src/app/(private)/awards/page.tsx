import { HighlightsPage } from '../highlights-page';
export default function Awards({ searchParams }: { searchParams: Promise<{ page?: string; edit?: string; error?: string; saved?: string; deleted?: string }> }) { return <HighlightsPage kind="awards" searchParams={searchParams} />; }
