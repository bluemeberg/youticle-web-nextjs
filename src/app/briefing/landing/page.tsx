import BriefingLandingPageClient from "../../b/[briefingId]/components/BriefingLandingPageClient";
import { normalizeSearchParams } from "../../b/[briefingId]/page";
import { fetchBriefingLanding } from "@/lib/briefingLanding";
import { notFound } from "next/navigation";

interface BriefingQueryPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export const revalidate = 0;

const BriefingQueryPage = async ({ searchParams }: BriefingQueryPageProps) => {
  const query = normalizeSearchParams(searchParams);
  const data = await fetchBriefingLanding(null, query);
  if (!data) {
    notFound();
  }

  return <BriefingLandingPageClient data={data} />;
};

export default BriefingQueryPage;
