import { HighlightsPage } from '../highlights-page';
export default function Monthly({ searchParams }: { searchParams: Promise<{ page?: string; edit?: string; error?: string; saved?: string; deleted?: string }> }) { return <HighlightsPage kind="monthly" searchParams={searchParams} />; }
