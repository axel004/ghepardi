import { HighlightsPage } from '../highlights-page';
export default function MonthlyGirl({ searchParams }: { searchParams: Promise<{ page?: string }> }) { return <HighlightsPage kind="monthly" girlOnly searchParams={searchParams} />; }
