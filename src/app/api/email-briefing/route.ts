import { NextResponse, type NextRequest } from "next/server";
import {
  fetchEmailDigestSection,
  isMoneySectionKey,
  isSlotPhase,
  toApiDate,
} from "@/lib/briefingLanding";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sectionLabel = searchParams.get("section");
  const slotParam = searchParams.get("slot");
  const sourceKeyParam = searchParams.get("source");
  const dateParam = searchParams.get("date");
  const generatedParam = searchParams.get("generated_date") ?? undefined;

  if (!sectionLabel) {
    return NextResponse.json(
      { error: "section label is required" },
      { status: 400 },
    );
  }

  const slotPhase = slotParam && isSlotPhase(slotParam) ? slotParam : "baseline";
  const sectionKey =
    sourceKeyParam && isMoneySectionKey(sourceKeyParam)
      ? sourceKeyParam
      : undefined;

  try {
    const briefing = await fetchEmailDigestSection(
      sectionLabel,
      toApiDate(generatedParam) ?? undefined,
      {
        sectionKey,
        slotPhase,
        date: toApiDate(dateParam ?? undefined),
      },
    );

    if (!briefing) {
      return NextResponse.json({ error: "briefing not found" }, { status: 404 });
    }

    return NextResponse.json(briefing);
  } catch (error) {
    console.error("email-briefing fetch failed", error);
    return NextResponse.json(
      { error: "failed to load email briefing" },
      { status: 500 },
    );
  }
}
