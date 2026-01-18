import BriefingLandingPageClient from "../../b/[briefingId]/components/BriefingLandingPageClient";
import { fetchBriefingLanding } from "@/lib/briefingLanding";
import { notFound } from "next/navigation";

interface BriefingQueryPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export const revalidate = 0;

const normalizeSearchParams = (
  raw?: Record<string, string | string[] | undefined>
) => {
  if (!raw) return undefined;

  const normalized: Record<string, string> = {};
  Object.entries(raw).forEach(([key, value]) => {
    const resolved = Array.isArray(value) ? value.join(",") : value;
    if (typeof resolved === "string" && resolved.trim().length > 0) {
      normalized[key] = resolved;
    }
  });

  if (normalized.data && !normalized.date) {
    normalized.date = normalized.data;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const BriefingQueryPage = async ({ searchParams }: BriefingQueryPageProps) => {
  const query = normalizeSearchParams(searchParams);
  const data = await fetchBriefingLanding(null, query);
  if (!data) {
    notFound();
  }

  return (
    <BriefingLandingPageClient
      data={data}
      phoneNumber={query?.phone}
      queryParams={query}
    />
  );
};

export default BriefingQueryPage;
