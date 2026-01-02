import BriefingLandingPageClient from "./components/BriefingLandingPageClient";
import { fetchBriefingLanding } from "@/lib/briefingLanding";
import { notFound } from "next/navigation";

interface BriefingLandingPageProps {
  params: {
    briefingId: string;
  };
}

export const revalidate = 0;

export default async function BriefingLandingPage({
  params,
}: BriefingLandingPageProps) {
  const data = await fetchBriefingLanding(params.briefingId);
  if (!data) {
    notFound();
  }

  return <BriefingLandingPageClient data={data} />;
}
