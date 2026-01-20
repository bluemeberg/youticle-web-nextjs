import { NextRequest, NextResponse } from "next/server";

import {
  fetchMoneySlotPackage,
  isMoneySectionKey,
  isSlotPhase,
  toApiDate,
} from "@/lib/briefingLanding";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sectionKey = searchParams.get("section");
  const slotId = searchParams.get("slot");
  const dateParam = searchParams.get("date") ?? undefined;

  if (!sectionKey || !slotId) {
    return NextResponse.json(
      { error: "Missing section or slot" },
      { status: 400 }
    );
  }

  if (!isMoneySectionKey(sectionKey) || !isSlotPhase(slotId)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    const slotPackage = await fetchMoneySlotPackage(
      sectionKey,
      slotId,
      toApiDate(dateParam)
    );
    if (!slotPackage) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    return NextResponse.json({ ...slotPackage, isPrefetched: true });
  } catch (error) {
    console.error("Failed to fetch slot package", error);
    return NextResponse.json(
      { error: "Failed to fetch slot package" },
      { status: 500 }
    );
  }
}
