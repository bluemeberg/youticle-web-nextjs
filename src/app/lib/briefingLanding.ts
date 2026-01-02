import { mockBriefingLanding, mockBriefingLandingById } from "@/data/mockBriefingLanding";
import type { BriefingLandingData } from "@/types/briefingLanding";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://youticle.shop";

export async function fetchBriefingLanding(
  briefingId: string
): Promise<BriefingLandingData | null> {
  const url = `${API_BASE_URL}/briefing/landing/${encodeURIComponent(briefingId)}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404) {
        return mockBriefingLandingById[briefingId] ?? mockBriefingLanding;
      }
      throw new Error(`Failed to load briefing landing: ${response.status}`);
    }
    const payload = (await response.json()) as BriefingLandingData;
    return payload;
  } catch (error) {
    console.warn("fetchBriefingLanding fallback", error);
    return mockBriefingLandingById[briefingId] ?? mockBriefingLanding;
  }
}
