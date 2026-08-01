import { getNewsItems } from "@/lib/news-feed";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  const { items, fetchedAt, stale } = await getNewsItems();

  return Response.json(
    { items, fetchedAt, stale },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
